# Signed operations (EIP-712)

Management requests — creating or modifying webhooks, registering a mini app, rotating a secret — are authenticated by having the **FID's custody address** sign a small structured payload using EIP-712 typed data. Hypersnap reads the custody address from on-chain `IdRegistry` state, so whoever controls the key controls the FID's resources, no extra enrollment step.

## What gets signed

All signed endpoints use the same typed-data shape:

```text
Domain:
  {
    name:    "Hypersnap",
    version: "1",
    chainId: 10
  }

Type:
  HypersnapSignedOp(
    string  op,           // operation name (see list below)
    uint64  fid,
    uint256 signedAt,     // unix seconds
    bytes32 nonce,
    bytes32 requestHash   // keccak256(raw HTTP body bytes)
  )
```

The `requestHash` is `keccak256` of the **raw bytes** of the HTTP body — no JSON re-canonicalization. This means the client and server hash the same bytes exactly.

## Required HTTP headers

| Header | Value |
|---|---|
| `X-Hypersnap-Fid` | Your FID (decimal string). |
| `X-Hypersnap-Op` | The operation name — see the table below. |
| `X-Hypersnap-Signed-At` | Unix seconds at time of signing. Must be within `signed_at_window_secs` (default 5 min) of the server clock. |
| `X-Hypersnap-Nonce` | `0x`-prefixed 32-byte random nonce. Deduped in-memory for the duration of the signed_at window so a replay is impossible. |
| `X-Hypersnap-Signature` | `0x`-prefixed 65-byte EIP-712 signature over the typed data above. |

## Operation names

The `X-Hypersnap-Op` header (and the `op` field inside the signed typed data) must match the HTTP method + path of the request. The server cross-checks them — a signed `webhook.create` cannot be replayed against a `DELETE` route.

| Endpoint | Op string |
|---|---|
| `POST /v2/farcaster/webhook/` | `webhook.create` |
| `PUT /v2/farcaster/webhook/` | `webhook.update` |
| `DELETE /v2/farcaster/webhook/` | `webhook.delete` |
| `GET /v2/farcaster/webhook/` (lookup) | `webhook.read` |
| `GET /v2/farcaster/webhook/list` | `webhook.read` |
| `POST /v2/farcaster/webhook/secret/rotate` | `webhook.rotate_secret` |
| `POST /v2/farcaster/frame/app/` | `app.create` |
| `PUT /v2/farcaster/frame/app/` | `app.update` |
| `DELETE /v2/farcaster/frame/app/` | `app.delete` |
| `GET /v2/farcaster/frame/app/` (lookup) | `app.read` |
| `GET /v2/farcaster/frame/app/list` | `app.read` |
| `POST /v2/farcaster/frame/app/secret/rotate` | `app.rotate_secret` |

## Server-side verification

The server performs these checks, in order, before routing a request to its handler:

1. **Clock skew** — reject if `|now − signed_at| > signed_at_window_secs`.
2. **Nonce replay** — reject if `(fid, nonce)` was used within the signed_at window.
3. **Typed data recovery** — compute the EIP-712 hash, recover the signer address via `ecrecover`.
4. **Custody match** — look up `custodyOf(fid)` on-chain and reject if the recovered address doesn't match.
5. **Op ↔ route match** — reject if the signed `op` doesn't match the actual HTTP method/path.

If any step fails you get `401 Unauthorized` with a short message body.

## Why this shape

- **Body bytes are signed directly**, so JSON canonicalization is a non-issue. You hash what you send.
- **Typed data is EIP-712-native**, so every Ethereum wallet library can produce the signature with a small adapter.
- **No session tokens.** Each request is individually signed; there is no login state the server has to track.
- **The nonce prevents replay** inside the signed_at window. Outside the window, clock skew rejects the request anyway.

## Minimal JavaScript example

```javascript
import { ethers } from "ethers";
import { randomBytes } from "crypto";

const wallet = new ethers.Wallet(privateKey);

const body = JSON.stringify({
  name: "my webhook",
  url: "https://receiver.example.com/hook",
  subscription: { cast_created: { author_fids: [3] } },
});

const signedAt = Math.floor(Date.now() / 1000);
const nonce = "0x" + randomBytes(32).toString("hex");
const requestHash = ethers.keccak256(ethers.toUtf8Bytes(body));

const domain  = { name: "Hypersnap", version: "1", chainId: 10 };
const types   = {
  HypersnapSignedOp: [
    { name: "op",          type: "string"  },
    { name: "fid",         type: "uint64"  },
    { name: "signedAt",    type: "uint256" },
    { name: "nonce",       type: "bytes32" },
    { name: "requestHash", type: "bytes32" },
  ],
};
const value = {
  op: "webhook.create",
  fid: 3n,
  signedAt: BigInt(signedAt),
  nonce,
  requestHash,
};

const signature = await wallet.signTypedData(domain, types, value);

const resp = await fetch("https://haatz.quilibrium.com/v2/farcaster/webhook/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Hypersnap-Fid":       "3",
    "X-Hypersnap-Op":        "webhook.create",
    "X-Hypersnap-Signed-At": String(signedAt),
    "X-Hypersnap-Nonce":     nonce,
    "X-Hypersnap-Signature": signature,
  },
  body,
});
```

See the [Sign an EIP-712 request](../guides/sign-eip712.md) guide for Python and Rust equivalents.
