# JSON Farcaster Signatures (JFS)

**JFS** is the signing envelope Farcaster *clients* (Warpcast et al.) use when they POST mini-app webhook events to a server. It is defined in the Farcaster Mini App spec at <https://miniapps.farcaster.xyz/docs/specification> and Hypersnap implements the server side of it to verify `miniapp_added` / `notifications_enabled` / ... events.

You almost certainly don't need to generate JFS yourself — clients do that. This page explains the wire format and verification rules so you understand what's happening under the hood and can debug if something goes wrong.

## Wire format

A JFS envelope is a JSON object with three base64url-encoded fields:

```json
{
  "header":    "<base64url>",
  "payload":   "<base64url JSON>",
  "signature": "<base64url>"
}
```

- **`header`** — base64url-encoded JSON containing the signer metadata:
  ```json
  { "fid": 12345, "type": "app_key", "key": "0x<ed25519 pubkey>" }
  ```
  The `key` is the Ed25519 public key the signer used, and `fid` is the Farcaster ID claiming it.

- **`payload`** — the event being signed, base64url-encoded. For mini-app webhooks, the decoded JSON is one of:
  - `{ "event": "miniapp_added",         "notificationDetails"?: { "url": "...", "token": "..." } }`
  - `{ "event": "miniapp_removed" }`
  - `{ "event": "notifications_enabled", "notificationDetails": { "url": "...", "token": "..." } }`
  - `{ "event": "notifications_disabled" }`

- **`signature`** — base64url-encoded 64-byte Ed25519 signature over the UTF-8 bytes of `<header_b64>.<payload_b64>` (yes, including the dot).

## How Hypersnap verifies it

When a Farcaster client POSTs a JFS envelope to `/v2/farcaster/frame/webhook/<app_id>`, Hypersnap:

1. Decodes the three base64url fields.
2. Recomputes `signing_input = header_b64 + "." + payload_b64`.
3. Verifies the Ed25519 signature against the `key` in the header.
4. Looks up the active signers for the `fid` in the on-chain `KeyRegistry` and confirms the signing key is currently active for that FID.
5. (If `signer_fid_allowlist` is set on the mini app) confirms `fid` is in the allowlist.
6. Applies the decoded event to the token store.

Steps 4–5 are the important ones: a valid Ed25519 signature is not enough on its own. The key must still be registered to a live FID on-chain, and (if the app opted in) must belong to a whitelisted signer FID.

## What you should do on the server side

If you're building a mini app and receiving JFS events on your own server (for cases where you aren't proxying through Hypersnap), the same rules apply:

1. **Verify signatures** using the Ed25519 public key in the header.
2. **Check that the signing key is currently active** for the claimed FID, by reading the `KeyRegistry`.
3. **Treat `notifications_disabled` and `miniapp_removed` as idempotent delete signals** — same token, repeated events, always converge to "gone".

Hypersnap does all of this for you; you only need to worry about it if you process JFS events yourself.
