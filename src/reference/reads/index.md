# Read API reference

Every endpoint in this section is public: no auth, no signed headers, no API key. Responses are served from local indexes over the data the Hypersnap node has ingested.

## Conventions

- **Base URL:** all paths are relative to the Hypersnap HTTP listener. Examples use `https://haatz.quilibrium.com` as a placeholder.
- **Content type:** responses are always `application/json`.
- **Pagination:** cursor-based; see [Pagination & cursors](../../concepts/pagination.md).
- **Errors:** see [Errors](../../concepts/errors.md). All errors return `{ "message": "..." }`.

## Endpoint groups

- **[Users](./users.md)** — lookup by FID, username, address, custody address, X/Twitter username, location; bulk; search; interactions; best friends; storage; FID listing; verifications.
- **[Casts](./casts.md)** — lookup by hash or URL; bulk; search; conversation threads; quotes; metrics.
- **[Feeds](./feeds.md)** — default, following, trending, for-you, channel, parent-url, topic, user-casts, popular, replies-and-recasts.
- **[Channels](./channels.md)** — lookup, list, bulk, search, trending, members, followers, active-for-user, invites.
- **[Reactions](./reactions.md)** — generic lookup, by-cast, by-user (with spec-compat aliases).
- **[Follows](./follows.md)** — followers, following, reciprocal (mutual), suggested (friends-of-friends), relevant.
- **[User notifications](./notifications.md)** — mentions/replies/reactions/follows for a FID, filterable by channel or parent URL.
- **[Usernames & proofs](./usernames.md)** — fname availability, username proofs.
- **[Signers & on-chain events](./signers.md)** — signer key registry, ID registry history.
- **[Blocks, mutes, bans](./blocks-mutes.md)** — block/mute lists from link messages.
- **[Batch reads](./batch.md)** — POST-body hydration for a list of FIDs (follows, reactions, signers, id-registrations, interactions).
