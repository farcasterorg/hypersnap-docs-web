# Errors

All error responses have the same shape:

```json
{ "message": "human-readable explanation" }
```

## HTTP status codes

| Code | Meaning | Example causes |
|---|---|---|
| `200 OK` | Success | Normal read, successful management write. |
| `400 Bad Request` | Malformed input | Missing required query param, invalid JSON body, invalid regex in a subscription filter, URL fails SSRF check, missing `?owner_fid=` when creating a webhook. |
| `401 Unauthorized` | Bad signature / auth headers | EIP-712 signature doesn't recover to the custody address, clock skew > 5min, nonce replayed, JFS signature invalid, send-endpoint `x-api-key` wrong, unknown FID. |
| `403 Forbidden` | Not the owner | You signed a valid EIP-712 request but the resource (webhook/app) belongs to a different FID. |
| `404 Not Found` | Resource doesn't exist | `webhook_id` / `app_id` / FID not found, unknown route. |
| `429 Too Many Requests` | Per-owner cap hit | Creating webhook #26 when `max_webhooks_per_owner=25`, or mini app #26. |
| `500 Internal Server Error` | Unexpected server fault | RocksDB error, panic in a handler, transient storage failure. Please file a bug. |

## Debugging auth failures

If you get a `401` on a signed request, work down this list:

1. **Is the raw body identical to what you hashed?** The server computes `keccak256(body_bytes)` on the literal HTTP body it received. If your HTTP client re-serializes JSON between signing and sending (pretty-print, key reordering), the hash won't match. Send raw bytes.
2. **Is your clock correct?** `|now − signed_at|` must be ≤ `signed_at_window_secs` (default 5 min). `date -u` on the client should match the server.
3. **Is the nonce fresh?** A replayed `(fid, nonce)` pair rejects for up to `2 × signed_at_window_secs`.
4. **Is your op string exactly right?** `webhook.create` not `webhook_create` or `createWebhook`. See [Signed operations](./authentication.md) for the full list.
5. **Does the op match the HTTP method/path?** A signed `webhook.create` on `DELETE /.../webhook/` returns `400 "signed op does not match the HTTP method/path"`.
6. **Is your custody address up to date?** Hypersnap reads the current custody from on-chain `IdRegistry` state. If you recently transferred the FID, give the indexer a few seconds to catch up.

## Debugging 429

Per-owner caps are opt-in and operator-controlled. If you're hitting a cap, either:

- Delete unused webhooks/apps via `DELETE /v2/farcaster/webhook/` or `DELETE /v2/farcaster/frame/app/` to free up slots, or
- Ask your operator to raise `max_webhooks_per_owner` / `max_apps_per_owner`.

## Debugging webhook delivery failures

Webhook delivery errors don't come back on your management-API call — they come back on the webhook delivery. See [Delivery contract](../reference/webhooks/delivery.md) for how successes and failures propagate.
