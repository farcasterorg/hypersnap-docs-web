# Integration checklist

Hand this page to your agent as acceptance criteria. Every item is small, testable, and answerable from the [Read API reference](../reference/reads/index.md), [Webhooks](../reference/webhooks/index.md), or [Mini-app notifications](../reference/miniapps/index.md) sections.

## For a read client

- [ ] Base URL is configurable (not hardcoded to one node).
- [ ] All calls are GET (or POST for batch reads); no auth headers required.
- [ ] Query parameters are URL-encoded correctly (commas in `fids=3,5` are fine).
- [ ] Cursor pagination: loop until `next.cursor` is null or response is shorter than `limit`.
- [ ] Parses `{ "message": "..." }` error bodies and surfaces status codes.
- [ ] Respects operator rate limits if/when they're enforced upstream.
- [ ] Handles `404` explicitly (not-found vs fetch error).
- [ ] Caches `User` and `Cast` objects sensibly.

## For a signed management caller (webhooks or mini-app registration)

- [ ] Domain struct is exactly `{ name: "Hypersnap", version: "1", chainId: 10 }`. No `verifyingContract`.
- [ ] `HypersnapSignedOp` type has these five fields in order: `op:string`, `fid:uint64`, `signedAt:uint256`, `nonce:bytes32`, `requestHash:bytes32`.
- [ ] `requestHash` is `keccak256` of the **literal** request body bytes.
- [ ] The body used for hashing is byte-for-byte the same as the body sent over the wire (no re-serialization between them).
- [ ] `X-Hypersnap-Fid` is a decimal string.
- [ ] `X-Hypersnap-Op` uses one of the documented op strings — `webhook.create`, `webhook.update`, `webhook.delete`, `webhook.read`, `webhook.rotate_secret`, `app.create`, `app.update`, `app.delete`, `app.read`, `app.rotate_secret`.
- [ ] `X-Hypersnap-Signed-At` is current unix seconds; clock skew ≤ 5 minutes from the server.
- [ ] `X-Hypersnap-Nonce` is a **fresh** random 32-byte value per request.
- [ ] `X-Hypersnap-Signature` is the 65-byte signature as `0x`-prefixed hex.
- [ ] The signed `op` matches the actual HTTP method + path (a signed `webhook.create` on a `PUT` request returns 400).
- [ ] Handles `401`, `403`, `404`, `429` with distinct error paths.
- [ ] Secret rotation flow deploys the new secret *after* reading the grace window.

## For a webhook receiver

- [ ] Endpoint is reachable from the public internet over HTTPS.
- [ ] Raw body bytes are preserved before any JSON parsing.
- [ ] HMAC-SHA512 verification uses a timing-safe comparison function.
- [ ] Rejects with `401` when no valid secret matches.
- [ ] Accepts deliveries signed with any secret in the currently-active set (supports rotation).
- [ ] Fetches the webhook's secrets on boot + periodically to refresh the accepted set.
- [ ] Returns `2xx` as soon as the event is durably enqueued for processing.
- [ ] Returns `5xx` on transient enqueue failure so Hypersnap retries.
- [ ] Returns `4xx` only when retry is pointless.
- [ ] Dedupes on the event's natural key (cast hash, reaction tuple, etc.).
- [ ] p95 response latency < 10 seconds (the default `delivery_timeout_secs`).
- [ ] Logs `(type, dedupe_key, first_sight, status)` on every request.

## For a mini-app notification sender

- [ ] `app_id` is stored configurably, not hardcoded.
- [ ] Send secret is stored server-side only; never shipped to the client.
- [ ] `POST` to `/v2/farcaster/frame/notifications/<app_id>` with `x-api-key: <send_secret>`.
- [ ] `notification.title` ≤ 32 chars; `notification.body` ≤ 128 chars; `target_url` ≤ 256 chars.
- [ ] Generates a per-notification `uuid` for dedupe (or reuses one deliberately on retry).
- [ ] Handles `retryable_fids` in the response by scheduling a retry 30+ seconds later.
- [ ] Handles `failure_count > 0` by logging, since the per-token reason is surfaced server-side.
- [ ] Rotates the send secret on a schedule, with zero downtime using the grace window.

## For a mini-app webhook-URL pointer

- [ ] Manifest `webhook_url` points at `https://<node>/v2/farcaster/frame/webhook/<app_id>`.
- [ ] `app_id` matches the one you registered.
- [ ] You don't need to implement the endpoint yourself.

## Cross-cutting

- [ ] Pinned to a known-good hypersnap git commit / release for production.
- [ ] Monitoring covers: HTTP success rate, signature verification failures, dedupe hit rate, retry queue depth.
- [ ] Runbook includes "what to do if the custody key rotates" and "what to do if the send secret leaks".

Hand this list to your agent as acceptance criteria alongside `llms-full.txt`. Every item is individually answerable from the docs, and every item prevents a real failure mode somebody has hit in integrating against the upstream Farcaster v2 contracts.
