# Mini-app notifications

Hypersnap is a multi-tenant proxy for [Farcaster Mini App notifications](https://miniapps.farcaster.xyz/docs/specification). Any Farcaster mini app can register with a Hypersnap node, receive the upstream token events, and send push notifications back to its users — using the exact wire contract the Farcaster Mini App spec defines, so clients (Warpcast, etc.) work against Hypersnap with no changes.

## Who should use this

- Mini-app developers who want push notifications on new content, social activity, or in-app events.
- Anyone who has implemented the upstream Farcaster Mini App notification flow against a different proxy and wants to switch.

## Three moving parts

1. **Register your app.** Sign a management request with your FID's custody key to create a mini-app record. Hypersnap assigns a random 16-character base58 `app_id` and returns a send secret. → [Registering a mini app](./registering.md)
2. **Receive token events.** Farcaster clients POST JFS-signed events to `/v2/farcaster/frame/webhook/<app_id>` when users add your app or toggle notifications. Hypersnap verifies + stores them. You don't need to implement this endpoint yourself — point the client at Hypersnap and you're done. → [Client token webhook](./token-webhook.md)
3. **Send notifications.** POST a payload to `/v2/farcaster/frame/notifications/<app_id>` with your send secret. Hypersnap looks up the enabled tokens for your app, groups them by notification URL, and POSTs to each client in batches. → [Sending notifications](./sending.md)

## Relationship to the rest of the API

This is its own pipeline, entirely separate from:

- **[Read API](../reads/index.md)** — unauthenticated GETs.
- **[Webhooks](../webhooks/index.md)** — outbound event streams to your servers.
- **[User notifications](../reads/notifications.md)** — the per-user in-app "mentions/replies" feed.

## Authentication summary

| Surface | Auth |
|---|---|
| `/v2/farcaster/frame/app/*` | [EIP-712 custody signature](../../concepts/authentication.md) |
| `/v2/farcaster/frame/webhook/<app_id>` | [JFS from a Farcaster client](../../concepts/jfs.md) |
| `/v2/farcaster/frame/notifications/<app_id>` | Per-app `x-api-key: <send_secret>` |

The send secret is returned at app-creation time and can be rotated via the signed management API. Treat it as an API key and keep it server-side.
