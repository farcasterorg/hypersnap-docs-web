# Data retention

Hypersnap stores data in three distinct tiers, each with its own retention characteristics:

## 1. Live message state

Casts, reactions, follows, verifications, user data — everything that has a Farcaster CRDT behind it — is subject to the per-FID storage limits defined by the network. See `/v2/farcaster/user/storage-allocations` and `/v2/farcaster/user/storage-usage` for the live state of a given FID.

When an FID's storage expires or is exceeded, older messages are pruned according to the store-specific CRDT rules. Hypersnap doesn't keep a local archive beyond what the protocol preserves.

## 2. Webhook retry queue

Failed deliveries are held on a durable RocksDB-backed retry queue for the duration of the retry schedule:

- Default `retry_max_attempts = 5`
- Default `retry_initial_backoff_ms = 500` (doubles each attempt)
- Total retry window ≈ a few minutes for a 5-retry sequence

If all retries fail, the delivery is dropped. It is not held indefinitely.

## 3. Mini-app notification tokens

Notification tokens are stored per `(fid, app_id)` indefinitely until:

- The Farcaster client sends a `notifications_disabled` or `miniapp_removed` JFS event (token is deleted / disabled).
- The send endpoint receives an `invalidTokens` response from the client for that token (Hypersnap deletes it).
- The mini app itself is deleted.

There is no background TTL sweeping the token store.

## 4. Nonce LRU

EIP-712 nonces are held in-memory for `2 × signed_at_window_secs` (default 10 minutes). This is long enough to prevent replay inside the signed-at window and short enough to bound memory. Replay attempts outside the window are rejected by clock skew regardless.

## What's *not* stored

- No session state, API keys, or user-facing credentials.
- No audit log of read traffic.
- No mirror of the operator's reverse-proxy logs.

Hypersnap is a Farcaster node first and a developer API second. Long-horizon retention beyond what the Farcaster protocol preserves is your responsibility if you need it — wire up an agent to a webhook, mirror the events you care about, and own that data in your own system.
