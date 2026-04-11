# Webhooks

Webhooks let your server receive filtered Farcaster events over HTTP, in realtime. Hypersnap dispatches an event to you whenever it matches your subscription — you don't have to poll or maintain a long-lived connection.

## Who should use this

- **Agents and bots** that need to react to casts, reactions, or follows as they happen.
- **Analytics pipelines** that index a filtered slice of the firehose.
- **Mini apps** that want to trigger server-side work when a user mentions them.

If you want to push content to *users* (not your own servers), you probably want [mini-app notifications](../miniapps/index.md) instead.

## Flow at a glance

1. **Register** a webhook via `POST /v2/farcaster/webhook/`, signed by your FID's custody key.
2. **Receive** HMAC-signed HTTP POSTs at your `target_url` whenever a matching event fires.
3. **Verify** the HMAC signature on your receiver using the secret the register response gave you.
4. **Respond** with a `2xx` for success, or a `4xx`/`5xx`/timeout for failure. Hypersnap retries transient failures with exponential backoff.

## The pieces

- **[Managing webhooks](./managing.md)** — create, read, update, delete, and rotate-secret over the signed management API.
- **[Subscription filters](./filters.md)** — the shape of the filter DSL. Per-event arrays (author_fids, mentioned_fids, …), text/embed regex, size caps.
- **[Delivery contract](./delivery.md)** — headers, HMAC computation, retry semantics, success/failure response codes.
- **[Event schemas](./events.md)** — the JSON shape of each event type you can subscribe to.

## Ownership

Webhooks are per-FID. To manage a webhook you sign a request with the FID's current custody key (see [Signed operations](../../concepts/authentication.md)). Only the owner can read, update, delete, or rotate. A default operator cap limits how many webhooks one FID can register — by default **25**.
