# Build a mini app

A Farcaster mini app is a hosted web app that clients (Warpcast, etc.) can launch inline, and that can push notifications back to users who have added it. The notification pipeline is what this guide covers.

If you already have the mini-app frontend built and just want to send pushes, you're in the right place.

## Pieces you need

1. **A Farcaster mini app frontend.** Standard web app behind an `app_url`. Nothing Hypersnap-specific.
2. **A mini-app manifest** the Farcaster client can read, containing the `webhook_url` pointer.
3. **A registered app record on a Hypersnap node.** Gives you an `app_id` and a send secret.
4. **Your backend** that calls the send endpoint when you want to push to users.

Steps 2 and 3 are the only Hypersnap-specific work.

## Step 1: Register the app

From your backend, sign an EIP-712 request with your FID's custody key:

```bash
# Pseudocode — see the sign-eip712 guide for a working example
SIG="$(eip712_sign 'app.create' $FID "$BODY")"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Hypersnap-Fid: $FID" \
  -H "X-Hypersnap-Op: app.create" \
  -H "X-Hypersnap-Signed-At: $SIGNED_AT" \
  -H "X-Hypersnap-Nonce: $NONCE" \
  -H "X-Hypersnap-Signature: $SIG" \
  -d "$BODY" \
  https://haatz.quilibrium.com/v2/farcaster/frame/app/
```

Where `$BODY` is:

```json
{
  "name": "my mini app",
  "app_url": "https://miniapp.example.com",
  "signer_fid_allowlist": []
}
```

Response:

```json
{
  "app": {
    "app_id": "3Hq9ZgK2p4vNfWxR",
    "send_secrets": [{ "value": "<hex send secret>", "..." : "..." }],
    "..." : "..."
  }
}
```

**Save these two values:**

- `app.app_id` — goes in the webhook URL and every send URL.
- `app.send_secrets[0].value` — the `x-api-key` for your send calls. Store server-side.

## Step 2: Point your manifest at Hypersnap

Your mini-app manifest includes a `webhook_url` that Farcaster clients will POST token events to. Use the Hypersnap receiver URL for this:

```json
{
  "name":        "my mini app",
  "icon_url":    "https://miniapp.example.com/icon.png",
  "home_url":    "https://miniapp.example.com",
  "webhook_url": "https://haatz.quilibrium.com/v2/farcaster/frame/webhook/3Hq9ZgK2p4vNfWxR"
}
```

Substitute `node.example.com` for your Hypersnap hostname and `3Hq9ZgK2p4vNfWxR` for your `app_id`.

Now when a user adds your mini app in a Farcaster client, the client POSTs a JFS-signed event to Hypersnap, which verifies and stores the notification token. You don't need to implement the receiver yourself — see [Client token webhook](../reference/miniapps/token-webhook.md) for the details of what Hypersnap is doing under the hood.

## Step 3: Send a notification

From your backend:

```javascript
const resp = await fetch(
  `https://haatz.quilibrium.com/v2/farcaster/frame/notifications/${APP_ID}`,
  {
    method: "POST",
    headers: {
      "x-api-key": SEND_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notification: {
        title: "New reply",
        body:  "alice replied to your post",
        target_url: `https://miniapp.example.com/thread/${threadId}`,
        uuid: crypto.randomUUID(),
      },
      target_fids: [12345],
    }),
  },
);
const result = await resp.json();
console.log("Campaign", result.campaign_id, "success", result.success_count);
```

The response tells you how many tokens succeeded / failed / were rate-limited. See [Sending notifications](../reference/miniapps/sending.md) for the full request/response schema.

## Step 4: Handle `retryable_fids`

When the Farcaster client rate-limits a token (spec: 1 / 30sec, 100 / day per token), the FID shows up in `retryable_fids`:

```json
{
  "campaign_id": "uuid",
  "success_count": 10,
  "failure_count": 0,
  "retryable_fids": [12345, 67890]
}
```

Schedule a retry 30+ seconds later. Either reuse the same `uuid` (the `(fid, notificationId)` dedupe prevents double-delivery if the original did go through) or generate a new one.

## Step 5: Rotate the send secret periodically

Good operational hygiene:

```bash
# Signed call
curl -X POST ... https://haatz.quilibrium.com/v2/farcaster/frame/app/secret/rotate?app_id=$APP_ID
```

Response has a fresh secret in `send_secrets[-1].value` and grace-expires the old one for 24 hours. Deploy the new secret to your backend during the grace window.

## Broadcasting vs targeting

- `target_fids: [12345]` — send to specific users.
- `target_fids: []` — send to every FID that has enabled notifications for your app.
- `target_fids: []` + `following_fid: 12345` — send to everyone who follows FID 12345.
- `target_fids: [12345, 67890]` + `exclude_fids: [12345]` — send to 67890 only.

## What you should not build

- **You shouldn't implement the JFS token webhook yourself** if you're proxying through Hypersnap. That's the whole point — let the node verify and store tokens, so your backend only needs the send endpoint.
- **You shouldn't persist the send secret in client code.** It's a server-side credential. If it leaks, rotate.
- **You shouldn't poll for token registrations.** They are transparently managed by Hypersnap; just send to `target_fids: []` to broadcast.
