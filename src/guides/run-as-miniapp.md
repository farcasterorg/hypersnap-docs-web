# Run the docs as a Farcaster mini app

This docs site is static HTML + JS. Point a Farcaster mini-app manifest at the hosted URL and it becomes a usable mini app — wallet already connected (via the client's embedded wallet), FID already known, and the [API playground](../playground.md) can sign management requests without any extra UI.

## Manifest

Create `manifest.json` at the root of wherever you're hosting the docs:

```json
{
  "name":        "Hypersnap docs",
  "icon_url":    "https://hypersnap-docs.qstorage.quilibrium.com/favicon-8114d1fc.png",
  "home_url":    "https://hypersnap-docs.qstorage.quilibrium.com/playground.html",
  "webhook_url": "https://haatz.quilibrium.com/v2/farcaster/frame/webhook/REPLACE-WITH-APP-ID"
}
```

The manifest targets the playground page as the home — that's the part developers will want to use. The `webhook_url` is there so the Farcaster client can POST token events; it can point at any valid Hypersnap `app_id`, including one you registered for the docs itself (so the docs can push notifications back to devs who star it).

## Detection inside the playground

The playground's Connect-wallet flow walks four detection paths in order and uses the first one that yields an EIP-1193 provider:

1. **Farcaster mini-app SDK, async API** — `window.sdk.wallet.getEthereumProvider()` if the global exposes the new async getter.
2. **Farcaster mini-app SDK, legacy sync property** — `window.sdk.wallet.ethProvider` or `window.farcasterMiniApp.ethProvider` for older clients.
3. **EIP-6963 multi-wallet discovery** — listens for `eip6963:announceProvider` events and picks the first announced provider. This is how modern extensions (MetaMask, Rabby, Coinbase Wallet) expose themselves without stomping on `window.ethereum`.
4. **Generic injected EIP-1193** — `window.ethereum` (or the first entry of `window.ethereum.providers` when multiple wallets have injected).

All four paths converge on the same `request({ method: "eth_signTypedData_v4", … })` call. The `source` badge next to the connected address tells you which path was used ("Farcaster mini-app", "MetaMask", "window.ethereum", etc.).

If none of the paths produce a provider, the Connect button surfaces a detailed error listing everything it tried — so you can tell whether your Farcaster client failed to inject the SDK, or the page is open in a plain browser with no wallet installed.

## What works, what doesn't

- **Public reads** — work identically inside or outside a mini app. No wallet needed.
- **Signed management calls** — work if the client's embedded wallet (or injected wallet) controls the custody address for the FID you set. If not, the signature will recover to a different address and Hypersnap returns `401`.
- **Send-secret endpoint** — works. You still have to paste the per-app secret into the field; the mini-app container has no way to hand it to the docs.

## Hosting notes

- Serve the `book/` directory from a CORS-friendly static host. GitHub Pages, Cloudflare Pages, Netlify, and direct S3 all work.
- The built site is fully self-contained — no runtime fetches to an API other than the Hypersnap host the user configured. That means your CSP can be strict: `connect-src 'self' https://*.quilibrium.com` is enough unless you want to allow arbitrary hostnames in the Host field.
- There is no build-time server-side rendering to worry about.

## Authoring new try-it panels

If you want to extend the playground with an endpoint that isn't already covered, the markup is:

```html
<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/..."
     data-title="optional label"
     data-auth="none|signed|send-key"
     data-op="webhook.read"
     data-fields="name|kind|type|placeholder|default|required; ..."
     data-body-template='{"optional": "pre-filled body"}'></div>
```

Where:

| Attribute | Meaning |
|---|---|
| `data-method` | HTTP method. |
| `data-path` | Path template. Use `{param}` for path parameters — they get replaced from fields with `kind=path`. |
| `data-title` | Human-readable label shown in the panel's summary row. |
| `data-auth` | `none` (default for unsigned reads), `signed` (EIP-712 — implied when `data-op` is set), or `send-key` (per-app `x-api-key`). |
| `data-op` | Op string for `signed` mode. One of `webhook.create` / `webhook.read` / etc. See [Signed operations](../concepts/authentication.md). |
| `data-fields` | Semi-colon-separated field specs. Each field is `name|kind|type|placeholder|default|required` with `kind` in `{query, path, body, header}`. |
| `data-body-template` | A starter JSON body shown in the body textarea. Users can edit before clicking Run. |

The playground JS hydrates every `.try-it` block it finds, so you can drop panels anywhere in the docs — they'll work in-page alongside the reference prose.
