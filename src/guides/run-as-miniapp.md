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

When loaded as a mini app, the playground JS looks for a Farcaster mini-app SDK global on the window:

```js
if (window.sdk && window.sdk.wallet && window.sdk.wallet.ethProvider) {
  // use sdk.wallet.ethProvider for eth_signTypedData_v4
}
```

It falls back to `window.ethereum` (MetaMask / Frame / Rabby / etc.) if the mini-app SDK isn't present. Either way, the rest of the flow is identical: the Connect wallet button asks for accounts, stores the active address in memory, and the Run button on each Try-it panel signs with that key.

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
