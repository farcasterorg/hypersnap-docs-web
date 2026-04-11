# Client token webhook

You almost never call this endpoint yourself — **Farcaster clients** (Warpcast, etc.) POST to it when a user adds, removes, enables, or disables your mini app.

This page is a reference for:

- Understanding what Hypersnap does with those events.
- Debugging cases where notifications aren't reaching users (did the event arrive?).

## URL

```
POST /v2/farcaster/frame/webhook/<app_id>
```

`<app_id>` is the 16-character base58 string Hypersnap gave you at app-creation time. You embed this URL in your mini app's manifest so Farcaster clients know where to POST.

## Request body — JFS envelope

```json
{
  "header":    "<base64url>",
  "payload":   "<base64url JSON>",
  "signature": "<base64url>"
}
```

This is a standard [JSON Farcaster Signature envelope](../../concepts/jfs.md). The decoded `payload` is one of:

```json
{ "event": "miniapp_added",         "notificationDetails": { "url": "https://...", "token": "..." } }
{ "event": "miniapp_removed" }
{ "event": "notifications_enabled", "notificationDetails": { "url": "https://...", "token": "..." } }
{ "event": "notifications_disabled" }
```

The four events map to state transitions on the user's relationship with your mini app:

| Event | What Hypersnap does |
|---|---|
| `miniapp_added` (with `notificationDetails`) | Upserts an enabled token for `(fid, app_id)`. |
| `miniapp_added` (without `notificationDetails`) | Records the add without a token (notifications opt-out). |
| `miniapp_removed` | Deletes all tokens for `(fid, app_id)`. |
| `notifications_enabled` | Upserts / re-enables a token. |
| `notifications_disabled` | Marks the token disabled but does not delete it. |

## Verification rules

Hypersnap applies these checks before touching the token store:

1. **Base64url decode** the three envelope fields.
2. **Ed25519 verify** the signature against the `key` in the JFS header.
3. **Active signer check** — look up the signer set for the claimed FID from the on-chain `KeyRegistry`. The signing key must be currently active.
4. **Signer allowlist** — if the mini-app record has a non-empty `signer_fid_allowlist`, the signer FID must be in it.

If any step fails, Hypersnap returns `401` and does not apply the event.

## Response shape

Successful ack:

```json
{ "success": true }
```

Failure:

```json
{ "success": false, "message": "..." }
```

Clients retry `5xx` and give up on `4xx` — same contract your own receiver would get, except here Hypersnap is the receiver and you're the beneficiary.

## What you need to implement

Nothing, as long as you're proxying through Hypersnap. Put the `/v2/farcaster/frame/webhook/<app_id>` URL in your mini app's manifest:

```json
{
  "name": "my mini app",
  "icon_url": "https://...",
  "home_url": "https://miniapp.example.com",
  "webhook_url": "https://haatz.quilibrium.com/v2/farcaster/frame/webhook/3Hq9ZgK2p4vNfWxR"
}
```

When users add your app, Farcaster clients POST to that URL, Hypersnap stores the token, and a subsequent call to your send endpoint will reach them.

## Debugging

If a user added your app but isn't receiving notifications:

1. **Check that the event arrived.** Hypersnap logs ingest failures at the `hypersnap::notifications` tracing target. A failed verification logs why (bad signature, inactive signer, not in allowlist).
2. **Check the app exists.** Call `GET /v2/farcaster/frame/app/?app_id=<id>` (signed) and confirm it returns `200`.
3. **Check the signer allowlist.** If you set `signer_fid_allowlist`, the user's Farcaster signer FID needs to be in it. An overly narrow allowlist is the most common mistake.
4. **Check you're pointed at the right app_id.** The `<app_id>` in the webhook URL and the `<app_id>` in your send endpoint calls must match.
