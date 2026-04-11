# API playground

Run real requests against a Hypersnap node without leaving this page. Every "Try it" panel in the docs uses the same machinery you see here — this page just collects one example per endpoint family in one place.

## How it works

- **Host.** The panels default to `https://haatz.quilibrium.com`, the public node. Change the Host field on any panel and it's remembered for the rest of your session.
- **FID.** Signed endpoints need to know which FID you're acting as. Set it once in the host bar and every signed panel picks it up.
- **Wallet.** The **Connect wallet** button talks to any EIP-1193 provider: MetaMask, Frame, Rabby, a Ledger via Frame, or the wallet embedded in a Farcaster client if you've loaded this page as a mini app. Signed requests use `eth_signTypedData_v4` — the library never sees your private key. Nothing is sent anywhere except directly to the node you configured.
- **Keccak-256.** The `requestHash` field inside the EIP-712 payload is computed locally with a vendored pure-JS Keccak-256 (self-tested at load time). There is no external JS dependency loaded at runtime.

> **Everything happens in your browser.** The docs are a static site. "Connect wallet" opens your wallet extension directly. "Run" issues a `fetch` from your browser to the configured Hypersnap host. The docs site is never in the middle and never sees your keys, signatures, or responses.

## Public reads — no wallet needed

### User lookup

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user"
     data-title="Look up a user by FID"
     data-auth="none"
     data-fields="fid|query|u64|e.g. 3|3|required"></div>

### Cast by hash

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast"
     data-title="Look up a cast by hash"
     data-auth="none"
     data-fields="identifier|query|string|0x-prefixed hash||required;type|query|string|hash or url|hash"></div>

### Following feed

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed/following"
     data-title="Render someone's following feed"
     data-auth="none"
     data-fields="fid|query|u64|whose feed||required;limit|query|usize|default 10|10"></div>

### Trending feed

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed/trending"
     data-title="Network-wide trending casts"
     data-auth="none"
     data-fields="limit|query|usize|default 10|10"></div>

### User search

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/search"
     data-title="Prefix search over usernames"
     data-auth="none"
     data-fields="q|query|string|query text||required;limit|query|usize||10"></div>

## Signed management — wallet required

These are the endpoints your custody key signs for. Click **Connect wallet** once, set your FID in the host bar, and every panel below will sign + submit when you click Run.

### Create a webhook

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/webhook/"
     data-title="Register a new webhook"
     data-op="webhook.create"
     data-body-template='{
  "name": "playground webhook",
  "url": "https://your-receiver.example.com/hook",
  "subscription": {
    "cast_created": { "author_fids": [3] }
  }
}'></div>

### List your webhooks

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/webhook/list"
     data-title="List every webhook you own"
     data-op="webhook.read"></div>

### Rotate a webhook signing secret

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/webhook/secret/rotate"
     data-title="Rotate a webhook's signing secret"
     data-op="webhook.rotate_secret"
     data-fields="webhook_id|query|uuid|webhook id||required"></div>

### Delete a webhook

<div class="try-it"
     data-method="DELETE"
     data-path="/v2/farcaster/webhook/"
     data-title="Delete a webhook"
     data-op="webhook.delete"
     data-fields="webhook_id|query|uuid|webhook id||required"></div>

### Register a mini app

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/app/"
     data-title="Register a new mini app"
     data-op="app.create"
     data-body-template='{
  "name": "my playground app",
  "app_url": "https://miniapp.example.com",
  "signer_fid_allowlist": []
}'></div>

### List your mini apps

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/frame/app/list"
     data-title="List every mini app you own"
     data-op="app.read"></div>

### Rotate mini-app send secret

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/app/secret/rotate"
     data-title="Rotate an app's send secret"
     data-op="app.rotate_secret"
     data-fields="app_id|query|string|16-char base58 id||required"></div>

## Send a notification — per-app x-api-key

This endpoint authenticates with your mini app's `send_secret`, not your custody key. Paste the secret directly into the `x-api-key` field below — nothing is persisted, nothing is sent anywhere except to the Hypersnap host you configured.

> Be careful pasting production secrets into a web page. For development + testing it's fine; for production sends, call the endpoint from your own backend.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/notifications/{app_id}"
     data-title="Send a push notification"
     data-auth="send-key"
     data-fields="app_id|path|string|16-char base58 id||required"
     data-body-template='{
  "notification": {
    "title": "hello",
    "body": "from the Hypersnap docs playground",
    "target_url": "https://miniapp.example.com",
    "uuid": "REPLACE-WITH-A-UUID"
  },
  "target_fids": [12345]
}'></div>

## Running as a mini app

The docs themselves can run inside a Farcaster client as a mini app. When loaded that way, Connect wallet talks to the client's embedded wallet via the Farcaster mini-app SDK, and your FID is already known. See [Run as a mini app](./guides/run-as-miniapp.md) for the one-line manifest that makes this work.

## Troubleshooting

- **"No Ethereum provider found"** — install a wallet extension (MetaMask / Frame / Rabby) or open the page inside a Farcaster client.
- **`401 signature mismatch`** — your FID's custody address on-chain doesn't match the key you just signed with. Check your wallet is on the right account.
- **`401 clock skew too large`** — your device clock is off. Fix the clock and retry.
- **`403 not the owner`** — you're trying to look up or mutate a webhook/app owned by a different FID. Set the FID that owns the resource, or create your own.
- **`429`** — you hit the per-FID cap (default 25 webhooks / 25 mini apps). Delete something or ask your operator to raise the cap.
- **Browser CORS error** — the host you configured either isn't CORS-enabled or isn't a Hypersnap node. `haatz.quilibrium.com` is CORS-open for all documented routes.
