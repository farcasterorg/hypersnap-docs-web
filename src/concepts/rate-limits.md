# Rate limits

Hypersnap is designed to be run by node operators for their own apps, not as a centralized API vendor, so the server-side rate-limiting story is modest. Here's the full picture:

## Public reads

There is **no built-in per-IP rate limit** on the public read endpoints. Your operator may run a reverse proxy (nginx, Cloudflare, envoy, etc.) in front of the node with its own rate limiting — check their operations docs.

In practice the node will happily serve tens of thousands of requests per second off RocksDB as long as disk/CPU hold up. Be a good citizen: cache heavy responses (feeds, search), obey your operator's posted limits, back off on 5xx.

## Webhook deliveries (outbound)

Each webhook has a per-webhook rate limit enforced by the dispatcher:

- Default: **1000 events per 60 seconds**, per webhook.
- Configured at node level via `default_rate_limit` / `default_rate_limit_duration_secs`.
- Events above the limit are dropped (counted in the `webhooks.delivery.rate_limited` metric), **not** queued.

If you expect high-volume event streams, either bump the rate limit with your operator or narrow your subscription filters so fewer events match.

## Mini-app notification send

The send endpoint has three applicable limits:

1. **Per-app dedupe window.** `(fid, notificationId)` is deduped for 24 hours by default. Sending the same notification twice within that window is a no-op for the recipient. This follows the Farcaster Mini App spec exactly.
2. **Per-token client limits.** The Farcaster client (Warpcast, etc.) enforces the spec-defined `1 notification per 30 seconds` and `100 per day` ceilings. Tokens that exceed those limits come back in `rate_limited_tokens` from the client, and Hypersnap returns the corresponding `fids` in `retryable_fids` so your code can retry later.
3. **Per-app token cap.** No hard limit — the registered token store is bounded by however many Farcaster users have added your mini app.

## Per-FID management caps

When signing management requests:

- **Webhooks:** `max_webhooks_per_owner` (default **25**). Creating a 26th returns `429 Too Many Requests`.
- **Mini apps:** `max_apps_per_owner` (default **25**). Same behavior.

Both caps are operator-configurable.

## Summary

| Surface | Limit | Enforced where |
|---|---|---|
| Public reads | None by default | Your operator's reverse proxy |
| Webhook delivery | 1000 events / 60 sec (default) | Hypersnap dispatcher |
| Send → client batch | 100 tokens per POST | Hypersnap sender (spec-mandated) |
| Send → per token | 1 / 30 sec, 100 / day | Farcaster client (spec-mandated), surfaced as `retryable_fids` |
| Send → dedupe | `(fid, notificationId)` for 24h | Hypersnap (spec-mandated) |
| Webhooks per FID | 25 (default) | Hypersnap store |
| Mini apps per FID | 25 (default) | Hypersnap store |
