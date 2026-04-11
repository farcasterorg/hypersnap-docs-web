# Glossary

**App ID**
: A 16-character base58 identifier assigned by Hypersnap when you register a mini app. Appears in URLs for the client token webhook and the send endpoint.

**Cast**
: The core Farcaster message type — a short post, optionally with parent context (a cast being replied to, or a channel parent URL).

**Channel**
: A parent-URL-scoped subcommunity. Casts can be posted into a channel by setting their `parent_url`. Channels have their own feeds, members, and lead moderators.

**Custody address**
: The Ethereum address currently in charge of an FID, per the on-chain `IdRegistry`. Signing a Hypersnap management request means producing an EIP-712 signature with this key.

**Dedupe window**
: The 24-hour time window over which `(fid, notificationId)` pairs are deduplicated on mini-app sends. Re-sending the same `uuid` to the same FID inside the window is a no-op.

**EIP-712**
: The Ethereum typed-data signing standard Hypersnap uses for management-request auth. Produces a structured signature distinct from arbitrary message signing.

**FID**
: Farcaster ID. A `u64` assigned by the on-chain `IdRegistry`. Permanent and non-transferable; the custody address that controls it can change.

**Grace period**
: The window during which a previously-active signing or send secret keeps working after a rotation. Default 24 hours. Exists so receivers and senders can switch over without downtime.

**HMAC-SHA512**
: The signing scheme used on outbound webhook deliveries. The per-webhook signing secret is the HMAC key; the raw HTTP body is the message.

**JFS**
: JSON Farcaster Signature. An Ed25519 signing envelope Farcaster clients use when POSTing mini-app token events. Defined in the Farcaster Mini App spec.

**Mini app**
: A hosted web app that Farcaster clients can launch inline and push notifications to. Registered with Hypersnap via the signed `/v2/farcaster/frame/app/` endpoints.

**Nonce**
: A 32-byte random value in every signed management request. Deduped in-memory for the duration of the signed_at window to prevent replay attacks.

**Notification token**
: The opaque per-(fid, app, client) identifier that a Farcaster client hands to a mini app when the user opts in. Used by the client to route push notifications.

**Op string**
: The string naming the operation a signed request is performing, e.g. `webhook.create`, `app.rotate_secret`. Both the `X-Hypersnap-Op` header and the `op` field inside the EIP-712 typed data carry this.

**Retry queue**
: A RocksDB-backed persistent queue holding webhook deliveries that hit transient failures. Re-injected onto the delivery pool with exponential backoff.

**Send secret**
: The per-mini-app bearer token used as the `x-api-key` header when calling the notification send endpoint. Rotated via `POST /v2/farcaster/frame/app/secret/rotate`.

**Signed operation**
: Any HTTP request that Hypersnap requires an EIP-712 signature for. The webhook management and mini-app registration endpoints are the signed surfaces today.

**Signer**
: An Ed25519 key registered to an FID via the on-chain `KeyRegistry`. Signs Farcaster messages (casts, reactions, follows) and JFS envelopes. Distinct from the custody address.

**Subscription**
: A filter spec attached to a webhook that picks which events get delivered. See [Subscription filters](../reference/webhooks/filters.md).

**Webhook**
: A registered HTTP endpoint that receives filtered Farcaster events as HMAC-signed POSTs. Created and managed via `/v2/farcaster/webhook/`.
