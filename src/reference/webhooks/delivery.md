# Delivery contract

When an event matches a webhook's subscription, Hypersnap POSTs a JSON envelope to the webhook's `target_url`. This page describes exactly what your receiver should expect and how to verify it.

## Request shape

**Method:** `POST`

**Headers**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Hypersnap-Signature` | `<hex(hmac_sha512(secret, raw_body))>` (header name is operator-configurable; this is the default) |

**Body**

```json
{
  "created_at": 1712345678,
  "type": "cast.created",
  "data": { /* event payload — see Event schemas */ }
}
```

The `type` field tells you which event schema applies. The `data` field carries the event payload — see [Event schemas](./events.md) for the per-type shapes.

## Verifying the signature

The signature is `hmac_sha512(secret, raw_body)`, hex-encoded. `raw_body` is the *literal bytes* of the HTTP body, not a re-serialized representation — verify before JSON-parsing.

### Node.js

```javascript
import crypto from "crypto";

function verify(req, secret) {
  const received = req.headers["x-hypersnap-signature"];
  const expected = crypto
    .createHmac("sha512", secret)
    .update(req.rawBody) // the literal bytes, NOT JSON.stringify(req.body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(received, "hex"),
    Buffer.from(expected, "hex"),
  );
}
```

### Python

```python
import hmac, hashlib

def verify(raw_body: bytes, received_hex: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), raw_body, hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(expected, received_hex)
```

### Rust

```rust,ignore
use hmac::{Hmac, Mac};
use sha2::Sha512;

fn verify(raw_body: &[u8], received_hex: &str, secret: &str) -> bool {
    let mut mac = Hmac::<Sha512>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(raw_body);
    let expected = hex::encode(mac.finalize().into_bytes());
    // subtle::ConstantTimeEq in production.
    expected == received_hex
}
```

## Which secret signs a delivery

The secret used for a given delivery is the **most recent non-expired entry** in the webhook's `secrets` array. During a rotation grace window you may see two valid secrets in the list at once. Your receiver should:

1. Keep a set of accepted secrets, not just one.
2. Try each in turn until one verifies.
3. Drop a secret from the accepted set after its `expires_at` passes.

This way a secret rotation never loses a delivery.

## Response codes Hypersnap expects

| Your response | Hypersnap's interpretation |
|---|---|
| `2xx` | Delivered. Counted as `webhooks.delivery.succeeded`. |
| `4xx` | Terminal failure. No retries. Counted as `webhooks.delivery.failed_4xx`. Your webhook is responsible for fixing whatever's wrong — a 4xx usually means a bug in the config (wrong URL path, auth) or a permanent rejection. |
| `5xx` | Transient failure. Retried with exponential backoff up to `retry_max_attempts`. Counted as `webhooks.delivery.failed_5xx`. |
| Timeout / network error | Transient failure. Retried. Counted as `webhooks.delivery.failed_network`. |

**Default timeout** on a single attempt: **10 seconds** (`delivery_timeout_secs`).

**Default retry schedule**: 5 attempts total, starting at 500ms and doubling (`retry_initial_backoff_ms × 2^attempt`). Failures in between live on a persistent RocksDB-backed retry queue so they survive restarts.

## Rate limiting

Each webhook has a rate limit enforced by the dispatcher:

- Default: **1000 events per 60 seconds**, per webhook.
- Events above the limit are **dropped**, not queued. Dropped events are counted in the `webhooks.delivery.rate_limited` metric.

If you expect high-volume streams, narrow your subscription filters so fewer events match, or ask your operator to raise the per-webhook limit.

## Delivery guarantees

- **At-least-once.** Transient failures + retries can replay the same `(event, attempt)` pair. Dedupe on the `data` field's natural key (cast hash, reaction unique tuple, etc.).
- **Not strictly ordered.** Two events for the same cast can arrive in either order if one is retried while the other succeeds first pass. If ordering matters, attach server timestamps from the event payload.
- **Transient failure ≠ lost.** 5xx/network failures go on the retry queue. You get them eventually.
- **4xx = lost.** If you reply 4xx, the event is permanently dropped. Reserve 4xx for cases where retrying would be pointless.

## Receiver checklist

- [ ] Verify every delivery's HMAC before trusting the body.
- [ ] Accept multiple active secrets during rotation grace windows.
- [ ] Return `2xx` as soon as you've durably enqueued the event; don't hold the connection open for downstream work.
- [ ] Dedupe on a natural key (cast hash, reaction tuple).
- [ ] Return `5xx` on transient failures so Hypersnap can retry.
- [ ] Reject with `4xx` only when there's nothing to be done.
- [ ] Keep your receiver's p95 latency under `delivery_timeout_secs`.
