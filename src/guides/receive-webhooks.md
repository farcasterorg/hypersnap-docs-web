# Receive webhooks

A deep-dive on running a production webhook receiver for Hypersnap. Covers signature verification, rotation, dedupe, retries, and backpressure.

## Minimum viable receiver

```javascript
import express from "express";
import crypto  from "crypto";

const app = express();
app.use(express.raw({ type: "application/json", limit: "1mb" }));

const SECRETS = new Set([process.env.WEBHOOK_SECRET]);

app.post("/hook", (req, res) => {
  const receivedHex = req.header("x-hypersnap-signature");
  if (!verifyAny(req.body, receivedHex, SECRETS)) {
    return res.status(401).end();
  }
  const event = JSON.parse(req.body.toString("utf8"));
  void handle(event);
  res.status(200).end();
});

function verifyAny(body, receivedHex, secrets) {
  const recv = Buffer.from(receivedHex, "hex");
  for (const s of secrets) {
    const exp = crypto.createHmac("sha512", s).update(body).digest();
    if (recv.length === exp.length && crypto.timingSafeEqual(recv, exp)) {
      return true;
    }
  }
  return false;
}

app.listen(8080);
```

The rest of this guide is what you do on top of this scaffold to make it robust.

## Signature verification

**Rule one: verify before parsing.** HMAC is computed over the raw bytes. If you parse JSON and re-serialize it, the bytes change (whitespace, key ordering) and your hash won't match the one in the header.

Express: use `express.raw`. Koa/fastify: look up the raw-body option on your framework. Lambda: use the `isBase64Encoded` + `body` as-received.

**Rule two: use constant-time comparison.** Never `==` on hex strings. Use `crypto.timingSafeEqual` / `hmac.compare_digest` / `subtle::ConstantTimeEq`.

**Rule three: accept multiple secrets during rotation.** See below.

## Handling secret rotation

When you rotate a webhook's secret, Hypersnap keeps the old one valid for a 24-hour grace window (configurable by your node operator). During that window, deliveries can be signed with either secret depending on timing. Your receiver needs to:

1. **Maintain an accepted-secrets set.** Start with the single active secret.
2. **When you rotate**, add the new one to the set.
3. **Try every secret** when verifying, return `401` only if none match.
4. **Drop the old secret** from the set once its `expires_at` has passed.

In code:

```javascript
const SECRETS = new Map(); // secret_value -> expires_at (null = active, never expires)

async function refreshSecrets() {
  const resp = await signedFetch("GET", "/v2/farcaster/webhook/?webhook_id=" + ID);
  const webhook = (await resp.json()).webhook;
  const now = Math.floor(Date.now() / 1000);
  SECRETS.clear();
  for (const s of webhook.secrets) {
    if (s.expires_at === null || s.expires_at > now) {
      SECRETS.set(s.value, s.expires_at);
    }
  }
}

// Refresh on boot and every few hours.
await refreshSecrets();
setInterval(refreshSecrets, 60 * 60 * 1000);
```

## Dedupe

Deliveries are **at-least-once**. Retries, transient failures, and network races can replay the same logical event. You need an idempotency layer.

Cheap version — Redis:

```javascript
async function handle(event) {
  const key = dedupeKey(event);
  const first = await redis.set(`wh:${key}`, "1", "EX", 3600, "NX");
  if (!first) return; // already processed
  await process(event);
}

function dedupeKey(event) {
  switch (event.type) {
    case "cast.created":
    case "cast.deleted":
      return `c:${event.data.cast.hash}`;
    case "follow.created":
    case "follow.deleted":
      return `f:${event.data.follower.fid}:${event.data.target.fid}`;
    case "reaction.created":
    case "reaction.deleted":
      return `r:${event.data.user.fid}:${event.data.cast.hash}:${event.data.reaction_type}`;
    default:
      return `x:${JSON.stringify(event.data)}`;
  }
}
```

A 1-hour TTL is enough for retries (the retry queue times out well before that).

## Return codes

| You return | Hypersnap's behavior |
|---|---|
| `2xx` | Delivered. |
| `4xx` | Terminal failure. No retries. |
| `5xx` | Retried up to `retry_max_attempts` (default 5) with exponential backoff. |
| Timeout / connection error | Retried as above. |

**Return `2xx` as fast as possible.** Enqueue the event to your local processing queue and ACK. Don't do downstream work on the HTTP handler's stack — you'll eat into the 10-second `delivery_timeout_secs` default and cause timeouts.

## Backpressure

At the default `default_rate_limit = 1000 events / 60 seconds`, you can get a sustained load of ~17 events/sec per webhook. That's small, but peaky — a hot thread can burst higher than average.

- Put a queue between the HTTP handler and your processor.
- Monitor queue depth.
- If the queue is backing up, your receiver should start returning `5xx` so Hypersnap requeues instead of dropping events.

## Observability

Log every delivery with:

- `event.type`
- Dedupe key
- Whether it was a first-sight or dedupe hit
- Processing outcome
- HTTP status returned

With those fields you can answer every support question ("did this event ever arrive?", "how many times?", "what did we do with it?").

Hypersnap emits per-webhook metrics at `webhooks.delivery.*` — ask your operator for the dashboard link so you can compare delivery counts against your local receiver stats.

## Testing

- **Signature verification:** unit-test with a known secret and a known body.
- **Rotation:** seed your receiver with two secrets and confirm it accepts deliveries signed by either.
- **Retries:** return `500` for a delivery and confirm Hypersnap retries with the expected backoff.
- **Dedupe:** feed the same event twice; confirm your downstream processing ran exactly once.

## Checklist

- [ ] Raw-body middleware preserves bytes for HMAC.
- [ ] `timingSafeEqual` for signature compare.
- [ ] Accept multiple secrets for rotation.
- [ ] Dedupe on natural keys.
- [ ] Return `2xx` after durable enqueue, not after processing.
- [ ] Return `5xx` on transient enqueue failure.
- [ ] Return `4xx` only when retry is pointless.
- [ ] Log `(type, dedupe_key, first_sight, status)` on every request.
