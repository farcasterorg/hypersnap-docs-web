/*
 * Hypersnap docs: interactive API playground.
 *
 * Injected into every page by mdBook via `additional-js`. Self-contained:
 * no external libraries, no CDN, no build step. Two pieces:
 *
 *   1. A pure-JS Keccak-256 (Ethereum flavor) — used to compute the
 *      requestHash field inside the EIP-712 typed data that management
 *      endpoints require. Self-tested at load time against two known
 *      vectors; signing is disabled if the tests fail.
 *
 *   2. A hydrator that looks for `<div class="try-it" ...>` markers in
 *      rendered markdown and replaces them with a working form that
 *      issues real HTTP calls against the configured Hypersnap host.
 *      For signed endpoints, it connects to a wallet (window.ethereum,
 *      or the Farcaster mini-app SDK if we're running inside a Farcaster
 *      client) and signs EIP-712 typed data.
 */
(function () {
  "use strict";

  // --------------------------- configuration -------------------------------

  const DEFAULT_HOST = "https://haatz.quilibrium.com";
  const HOST_KEY     = "hypersnap.playground.host";
  const FID_KEY      = "hypersnap.playground.fid";
  const EIP712_DOMAIN = { name: "Hypersnap", version: "1", chainId: 10 };
  const EIP712_TYPES = {
    EIP712Domain: [
      { name: "name",    type: "string"  },
      { name: "version", type: "string"  },
      { name: "chainId", type: "uint256" },
    ],
    HypersnapSignedOp: [
      { name: "op",          type: "string"  },
      { name: "fid",         type: "uint64"  },
      { name: "signedAt",    type: "uint256" },
      { name: "nonce",       type: "bytes32" },
      { name: "requestHash", type: "bytes32" },
    ],
  };

  // --------------------------- Keccak-256 ----------------------------------

  const MASK64 = 0xffffffffffffffffn;

  // Round constants for Keccak-f[1600].
  const RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
  ];

  // Rho rotation offsets, indexed by (x + 5*y).
  const R = [
     0,  1, 62, 28, 27,
    36, 44,  6, 55, 20,
     3, 10, 43, 25, 39,
    41, 45, 15, 21,  8,
    18,  2, 61, 56, 14,
  ];

  function rotl64(x, n) {
    const nn = BigInt(n) & 63n;
    return ((x << nn) | (x >> (64n - nn))) & MASK64;
  }

  function keccakF1600(s) {
    for (let round = 0; round < 24; round++) {
      // θ
      const C0 = s[0] ^ s[5] ^ s[10] ^ s[15] ^ s[20];
      const C1 = s[1] ^ s[6] ^ s[11] ^ s[16] ^ s[21];
      const C2 = s[2] ^ s[7] ^ s[12] ^ s[17] ^ s[22];
      const C3 = s[3] ^ s[8] ^ s[13] ^ s[18] ^ s[23];
      const C4 = s[4] ^ s[9] ^ s[14] ^ s[19] ^ s[24];
      const D0 = C4 ^ rotl64(C1, 1);
      const D1 = C0 ^ rotl64(C2, 1);
      const D2 = C1 ^ rotl64(C3, 1);
      const D3 = C2 ^ rotl64(C4, 1);
      const D4 = C3 ^ rotl64(C0, 1);
      s[0] ^= D0;  s[5] ^= D0;  s[10] ^= D0; s[15] ^= D0; s[20] ^= D0;
      s[1] ^= D1;  s[6] ^= D1;  s[11] ^= D1; s[16] ^= D1; s[21] ^= D1;
      s[2] ^= D2;  s[7] ^= D2;  s[12] ^= D2; s[17] ^= D2; s[22] ^= D2;
      s[3] ^= D3;  s[8] ^= D3;  s[13] ^= D3; s[18] ^= D3; s[23] ^= D3;
      s[4] ^= D4;  s[9] ^= D4;  s[14] ^= D4; s[19] ^= D4; s[24] ^= D4;

      // ρ + π
      const B = new Array(25);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const src = x + 5 * y;
          const dst = y + 5 * ((2 * x + 3 * y) % 5);
          B[dst] = rotl64(s[src], R[src]);
        }
      }

      // χ
      for (let y = 0; y < 5; y++) {
        const b = y * 5;
        const b0 = B[b], b1 = B[b + 1], b2 = B[b + 2], b3 = B[b + 3], b4 = B[b + 4];
        s[b    ] = (b0 ^ ((~b1) & b2)) & MASK64;
        s[b + 1] = (b1 ^ ((~b2) & b3)) & MASK64;
        s[b + 2] = (b2 ^ ((~b3) & b4)) & MASK64;
        s[b + 3] = (b3 ^ ((~b4) & b0)) & MASK64;
        s[b + 4] = (b4 ^ ((~b0) & b1)) & MASK64;
      }

      // ι
      s[0] ^= RC[round];
    }
  }

  function keccak256Bytes(input) {
    const bytes =
      typeof input === "string" ? new TextEncoder().encode(input)
      : input instanceof Uint8Array ? input
      : new Uint8Array(input);
    const rate  = 136; // bytes; 1088 bits for Keccak-256
    const state = new Array(25).fill(0n);

    // Absorb full rate-sized blocks.
    let offset = 0;
    while (offset + rate <= bytes.length) {
      for (let i = 0; i < rate / 8; i++) {
        let lane = 0n;
        for (let j = 0; j < 8; j++) {
          lane |= BigInt(bytes[offset + i * 8 + j]) << BigInt(j * 8);
        }
        state[i] ^= lane;
      }
      keccakF1600(state);
      offset += rate;
    }

    // Final block + padding (Ethereum Keccak flavor: 0x01 ... 0x80).
    const finalBlock = new Uint8Array(rate);
    const remaining  = bytes.length - offset;
    if (remaining > 0) finalBlock.set(bytes.subarray(offset), 0);
    finalBlock[remaining]  = 0x01;
    finalBlock[rate - 1]  |= 0x80;
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 0; j < 8; j++) {
        lane |= BigInt(finalBlock[i * 8 + j]) << BigInt(j * 8);
      }
      state[i] ^= lane;
    }
    keccakF1600(state);

    // Squeeze first 32 bytes.
    const out = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
      const lane = state[i];
      for (let j = 0; j < 8; j++) {
        out[i * 8 + j] = Number((lane >> BigInt(j * 8)) & 0xffn);
      }
    }
    return out;
  }

  function toHex(bytes) {
    let hex = "0x";
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return hex;
  }

  function keccak256Hex(input) { return toHex(keccak256Bytes(input)); }

  // Self-test at load time — the playground disables signing if these fail.
  const KECCAK_OK = (function () {
    try {
      const empty = keccak256Hex("");
      const abc   = keccak256Hex("abc");
      return (
        empty === "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" &&
        abc   === "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"
      );
    } catch (_) {
      return false;
    }
  })();
  if (!KECCAK_OK) {
    console.warn("[hypersnap playground] keccak256 self-test failed — signing disabled.");
  }

  // --------------------------- state ---------------------------------------

  function getHost() {
    try {
      return localStorage.getItem(HOST_KEY) || DEFAULT_HOST;
    } catch (_) { return DEFAULT_HOST; }
  }
  function setHost(v) {
    try { localStorage.setItem(HOST_KEY, v); } catch (_) {}
  }
  function getStoredFid() {
    try { return localStorage.getItem(FID_KEY) || ""; } catch (_) { return ""; }
  }
  function setStoredFid(v) {
    try { localStorage.setItem(FID_KEY, v); } catch (_) {}
  }

  const wallet = {
    address: null,
    provider: null,  // Either window.ethereum or a Farcaster mini-app-provided EIP-1193 provider.
    source: null,    // "mini-app" | "window.ethereum"
  };

  async function detectProvider() {
    // Farcaster mini-app SDK (if loaded).
    if (window.sdk && window.sdk.wallet && window.sdk.wallet.ethProvider) {
      return { provider: window.sdk.wallet.ethProvider, source: "mini-app" };
    }
    if (window.farcasterMiniApp && window.farcasterMiniApp.ethProvider) {
      return { provider: window.farcasterMiniApp.ethProvider, source: "mini-app" };
    }
    // Generic EIP-1193 injected provider (MetaMask, Frame, Rabby, etc.).
    if (window.ethereum) {
      return { provider: window.ethereum, source: "window.ethereum" };
    }
    return null;
  }

  async function connectWallet() {
    const detected = await detectProvider();
    if (!detected) {
      throw new Error("No Ethereum provider found. Install MetaMask / Frame / Rabby, or open this page inside a Farcaster client with a connected wallet.");
    }
    const accounts = await detected.provider.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) throw new Error("No accounts returned by wallet.");
    wallet.address  = accounts[0];
    wallet.provider = detected.provider;
    wallet.source   = detected.source;
    document.dispatchEvent(new CustomEvent("hypersnap-wallet-changed", { detail: { ...wallet } }));
    return wallet;
  }

  function disconnectWallet() {
    wallet.address = null;
    wallet.provider = null;
    wallet.source = null;
    document.dispatchEvent(new CustomEvent("hypersnap-wallet-changed", { detail: { ...wallet } }));
  }

  // --------------------------- signing -------------------------------------

  function randomNonceHex() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return toHex(arr);
  }

  async function signTypedData(op, fid, bodyBytes) {
    if (!KECCAK_OK) throw new Error("keccak256 unavailable (self-test failed)");
    if (!wallet.provider) await connectWallet();
    const signedAt    = Math.floor(Date.now() / 1000);
    const nonce       = randomNonceHex();
    const requestHash = keccak256Hex(bodyBytes);
    const typedData = {
      domain:      EIP712_DOMAIN,
      primaryType: "HypersnapSignedOp",
      types:       EIP712_TYPES,
      message: {
        op,
        fid: String(fid),
        signedAt: String(signedAt),
        nonce,
        requestHash,
      },
    };
    const signature = await wallet.provider.request({
      method: "eth_signTypedData_v4",
      params: [wallet.address, JSON.stringify(typedData)],
    });
    return { signedAt, nonce, signature };
  }

  // --------------------------- HTTP runner ---------------------------------

  async function runRead({ method, path, query, body }) {
    const host = getHost().replace(/\/+$/, "");
    const qs = query && Object.keys(query).length
      ? "?" + Object.entries(query)
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
          .join("&")
      : "";
    const url = host + path + qs;
    const init = { method, headers: {} };
    if (body) {
      init.headers["Content-Type"] = "application/json";
      init.body = body;
    }
    const start = performance.now();
    const resp = await fetch(url, init);
    const ms = Math.round(performance.now() - start);
    const text = await resp.text();
    return { url, method, status: resp.status, ms, body: text };
  }

  async function runSigned({ method, path, query, op, body, fid, sendKey }) {
    const host = getHost().replace(/\/+$/, "");
    const qs = query && Object.keys(query).length
      ? "?" + Object.entries(query)
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
          .join("&")
      : "";
    const url = host + path + qs;
    const bodyBytes = body != null ? new TextEncoder().encode(body) : new Uint8Array(0);
    const headers = { "Content-Type": "application/json" };

    if (sendKey) {
      // Per-app x-api-key — mini-app send endpoint.
      headers["x-api-key"] = sendKey;
    } else if (op) {
      // EIP-712 signed management call.
      const s = await signTypedData(op, fid, bodyBytes);
      headers["X-Hypersnap-Fid"]       = String(fid);
      headers["X-Hypersnap-Op"]        = op;
      headers["X-Hypersnap-Signed-At"] = String(s.signedAt);
      headers["X-Hypersnap-Nonce"]     = s.nonce;
      headers["X-Hypersnap-Signature"] = s.signature;
    }

    const start = performance.now();
    const resp = await fetch(url, { method, headers, body: body != null ? bodyBytes : undefined });
    const ms = Math.round(performance.now() - start);
    const text = await resp.text();
    return { url, method, status: resp.status, ms, body: text };
  }

  // --------------------------- rendering -----------------------------------

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function prettyJson(text) {
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch (_) { return text; }
  }

  // Render the per-panel host bar. Public reads only need a Host field;
  // signed management requests also need FID + Connect wallet; the
  // send-key flow only needs Host (the x-api-key is a form field).
  function renderHostBar(auth) {
    const hostVal = escapeHtml(getHost());
    const fidVal  = escapeHtml(getStoredFid());
    const walletBits = auth === "signed" ? `
        <label>FID
          <input type="text" class="hp-fid" value="${fidVal}" placeholder="your fid" />
        </label>
        <button type="button" class="hp-connect">Connect wallet</button>
        <span class="hp-wallet-addr"></span>
    ` : "";
    return `
      <div class="hp-bar">
        <label>Host
          <input type="text" class="hp-host" value="${hostVal}" />
        </label>
        ${walletBits}
      </div>
    `;
  }

  function updateWalletBadge(root) {
    root.querySelectorAll(".hp-wallet-addr").forEach((el) => {
      if (wallet.address) {
        const short = wallet.address.slice(0, 6) + "…" + wallet.address.slice(-4);
        el.textContent = `${short} (${wallet.source})`;
        el.classList.add("hp-connected");
      } else {
        el.textContent = "";
        el.classList.remove("hp-connected");
      }
    });
  }

  function parseFields(raw) {
    if (!raw) return [];
    return raw.split(";").map((chunk) => {
      const parts = chunk.split("|").map((s) => s.trim());
      return {
        name:        parts[0],
        kind:        parts[1] || "query", // "query" | "path" | "body" | "header"
        type:        parts[2] || "string",
        placeholder: parts[3] || "",
        defaultVal:  parts[4] || "",
        required:    parts[5] === "required",
      };
    }).filter((f) => f.name);
  }

  function hydratePanel(el) {
    const method   = (el.dataset.method || "GET").toUpperCase();
    const pathTmpl = el.dataset.path || "/";
    const title    = el.dataset.title || `${method} ${pathTmpl}`;
    const op       = el.dataset.op || "";
    const auth     = el.dataset.auth || (op ? "signed" : "none"); // none | signed | send-key
    const fields   = parseFields(el.dataset.fields || "");
    const bodyTmpl = el.dataset.bodyTemplate || "";

    const fieldInputs = fields.map((f) => {
      const placeholder = escapeHtml(f.placeholder || `${f.name} (${f.type})`);
      const value = escapeHtml(f.defaultVal);
      const label = escapeHtml(f.name + (f.required ? " *" : ""));
      const nameAttr = escapeHtml(f.name);
      const kindAttr = escapeHtml(f.kind);
      return `
        <label class="hp-field">
          <span>${label}</span>
          <input type="text" name="${nameAttr}" data-kind="${kindAttr}" placeholder="${placeholder}" value="${value}" />
        </label>
      `;
    }).join("");

    const bodyBox = bodyTmpl
      ? `<label class="hp-body-box"><span>Request body</span><textarea class="hp-body" rows="6">${escapeHtml(bodyTmpl)}</textarea></label>`
      : "";

    const sendKeyBox = auth === "send-key"
      ? `<label class="hp-field"><span>x-api-key *</span><input type="password" class="hp-send-key" placeholder="your app send secret" /></label>`
      : "";

    const authNote =
      auth === "signed"    ? `<div class="hp-auth-note">Requires wallet connection. Signs with the custody key for the FID in the host bar.</div>` :
      auth === "send-key"  ? `<div class="hp-auth-note">Authenticated with your per-app <code>x-api-key</code>. Never paste a production secret here.</div>` :
                             `<div class="hp-auth-note">Unauthenticated public read.</div>`;

    el.innerHTML = `
      <details class="hp-panel" open>
        <summary>
          <span class="hp-method hp-${method.toLowerCase()}">${method}</span>
          <code>${escapeHtml(pathTmpl)}</code>
          <span class="hp-title">— ${escapeHtml(title)}</span>
        </summary>
        ${renderHostBar(auth)}
        ${authNote}
        <form class="hp-form">
          ${fieldInputs}
          ${sendKeyBox}
          ${bodyBox}
          <button type="submit" class="hp-run">Run</button>
        </form>
        <div class="hp-output" hidden>
          <div class="hp-meta"></div>
          <pre class="hp-body-out"></pre>
        </div>
      </details>
    `;

    // Wire host bar inputs.
    const hostInput = el.querySelector(".hp-host");
    hostInput.addEventListener("change", () => setHost(hostInput.value.trim()));

    // Wallet + FID controls only exist on signed panels.
    const fidInput = el.querySelector(".hp-fid");
    if (fidInput) {
      fidInput.addEventListener("change", () => setStoredFid(fidInput.value.trim()));
    }
    const connectBtn = el.querySelector(".hp-connect");
    if (connectBtn) {
      connectBtn.addEventListener("click", async () => {
        try { await connectWallet(); updateWalletBadge(document); }
        catch (e) { alert("Connect failed: " + (e && e.message ? e.message : e)); }
      });
      updateWalletBadge(el);
    }

    // Submit.
    el.querySelector(".hp-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const out     = el.querySelector(".hp-output");
      const meta    = el.querySelector(".hp-meta");
      const bodyOut = el.querySelector(".hp-body-out");
      out.hidden = false;
      meta.textContent = "running…";
      bodyOut.textContent = "";

      try {
        // Resolve the path template with path params.
        const query = {};
        let path = pathTmpl;
        el.querySelectorAll(".hp-field input").forEach((inp) => {
          if (inp.classList.contains("hp-send-key")) return;
          const kind = inp.dataset.kind;
          const name = inp.name;
          const val  = inp.value;
          if (kind === "path") {
            path = path.replace("{" + name + "}", encodeURIComponent(val));
          } else if (kind === "query" && val !== "") {
            query[name] = val;
          }
        });

        // Determine body bytes.
        let body = null;
        const bodyEl = el.querySelector(".hp-body");
        if (bodyEl) body = bodyEl.value;

        let result;
        if (auth === "none") {
          result = await runRead({ method, path, query, body });
        } else if (auth === "send-key") {
          const sendKey = el.querySelector(".hp-send-key").value;
          if (!sendKey) throw new Error("x-api-key required");
          result = await runSigned({ method, path, query, body, sendKey });
        } else {
          // signed
          const fid = (getStoredFid() || "").trim();
          if (!fid) throw new Error("FID required (set it in the host bar)");
          result = await runSigned({ method, path, query, body, op, fid });
        }

        meta.innerHTML = `${result.method} <code>${escapeHtml(result.url)}</code> → <strong>${result.status}</strong> <span class="hp-ms">${result.ms}ms</span>`;
        bodyOut.textContent = prettyJson(result.body);
      } catch (e) {
        meta.textContent = "error";
        bodyOut.textContent = (e && e.message) ? e.message : String(e);
      }
    });
  }

  function hydrateAll() {
    document.querySelectorAll("div.try-it").forEach(hydratePanel);
  }

  // Keep wallet badges in sync across hydrated panels.
  document.addEventListener("hypersnap-wallet-changed", () => updateWalletBadge(document));

  // mdBook may replace content during in-page nav; run on DOMContentLoaded and expose for callers.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateAll);
  } else {
    hydrateAll();
  }
  window.HypersnapPlayground = {
    hydrateAll, connectWallet, disconnectWallet, keccak256Hex,
    get wallet() { return wallet; },
    KECCAK_OK,
  };
})();
