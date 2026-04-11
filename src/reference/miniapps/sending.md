# Sending notifications

```
POST /v2/farcaster/frame/notifications/<app_id>
```

This is the endpoint you call from your backend when you want to push a notification to your mini app's users.

**Auth:** `x-api-key: <send_secret>`. The value must match the most recently created unexpired entry in your app's `send_secrets` array. See [Registering a mini app](./registering.md) for how to obtain and rotate the secret.

## Request body

```json
{
  "notification": {
    "title":      "string (≤32 chars)",
    "body":       "string (≤128 chars)",
    "target_url": "https://miniapp.example.com/path/in/app",
    "uuid":       "optional UUID string"
  },
  "target_fids":   [12345, 67890],
  "exclude_fids":  [],
  "following_fid": null,
  "minimum_user_score": null,
  "near_location":     null
}
```

### notification

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | ≤ 32 characters (spec limit). |
| `body` | string | yes | ≤ 128 characters (spec limit). |
| `target_url` | string | yes | ≤ 256 characters. Must be the same domain as your mini-app's `app_url`. |
| `uuid` | string | no | A UUID you supply. Becomes the `notificationId` on the per-client fan-out. Enables `(fid, notificationId)` dedupe within the 24h window. Generate a random UUID per logical notification. |

### Targeting

- `target_fids` — explicit list of FIDs to deliver to. Empty = all enabled FIDs for this app.
- `exclude_fids` — FIDs to drop from the computed recipient set after filtering.
- `following_fid` — if set, only deliver to FIDs that follow this FID (useful for "notify your followers when you post").
- `minimum_user_score` — accepted for forward compatibility. No local user-score signal exists yet; Hypersnap parses but does not enforce this field.
- `near_location` — accepted for forward compatibility. Not enforced.

## Response

```json
{
  "campaign_id":         "uuid",
  "success_count":       42,
  "failure_count":       1,
  "not_attempted_count": 0,
  "retryable_fids":      [12345]
}
```

| Field | Meaning |
|---|---|
| `campaign_id` | Server-assigned UUID for this send. Log it alongside your internal request id so you can trace deliveries. |
| `success_count` | Tokens the downstream Farcaster client confirmed success on. |
| `failure_count` | Tokens that returned failure (invalid / rate-limited). |
| `not_attempted_count` | Tokens that were deduped out by `(fid, notificationId)` dedupe or filtered by `exclude_fids` / `following_fid`. |
| `retryable_fids` | FIDs whose tokens came back as `rateLimitedTokens` from the client. Safe to retry later. |

## What Hypersnap does on the wire

1. Looks up the mini app by `<app_id>`.
2. Resolves the recipient FIDs (explicit `target_fids` or all enabled tokens) and applies `exclude_fids` / `following_fid` filters.
3. Dedupes `(fid, notificationId)` pairs against the 24-hour LRU.
4. Groups remaining tokens by their `notification_url` (each Farcaster client has its own URL).
5. POSTs to each URL in batches of ≤ 100 tokens, in parallel up to `send_concurrency`.
6. Aggregates the per-client responses into the `SendNotificationResult` above.

The per-client POST body is the Mini App spec contract:

```json
{
  "notificationId": "string (≤128)",
  "title":          "string (≤32)",
  "body":           "string (≤128)",
  "targetUrl":      "string (≤1024, same domain)",
  "tokens":         ["token-a", "token-b"]
}
```

And the client response is interpreted as:

- `successfulTokens` → counted in `success_count`.
- `invalidTokens` → permanently deleted from Hypersnap's token store.
- `rateLimitedTokens` → the owning FIDs are returned in `retryable_fids`.

## Rate limits (per spec)

- **Per token:** 1 notification per 30 seconds, 100 per day. Enforced by the Farcaster client, surfaced via `rate_limited_tokens`.
- **`(fid, notificationId)` dedupe:** 24 hours. Enforced by Hypersnap.

## Try it

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/notifications/{app_id}"
     data-title="Try send notification"
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

## Examples

### Send to one user

```bash
curl -X POST \
  -H "x-api-key: $SEND_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "notification": {
      "title": "You got a reply",
      "body":  "alice: loved your take on this",
      "target_url": "https://miniapp.example.com/thread/0xabc",
      "uuid": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    },
    "target_fids": [12345]
  }' \
  https://haatz.quilibrium.com/v2/farcaster/frame/notifications/3Hq9ZgK2p4vNfWxR
```

### Broadcast to everyone who has enabled notifications

```bash
curl -X POST \
  -H "x-api-key: $SEND_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "notification": {
      "title": "New season drop",
      "body":  "Season 5 just opened — tap to play",
      "target_url": "https://miniapp.example.com/season/5",
      "uuid": "b2f63f8a-..."
    },
    "target_fids": []
  }' \
  https://haatz.quilibrium.com/v2/farcaster/frame/notifications/3Hq9ZgK2p4vNfWxR
```

### Handle retryable FIDs

If the response comes back with `retryable_fids: [12345]`, schedule a retry 30+ seconds later with a fresh `uuid` (or keep the same one — the dedupe key `(fid, notificationId)` guarantees the same logical notification still won't arrive twice).
