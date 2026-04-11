# Read API reference

Every endpoint in this section is public: no auth, no signed headers, no API key. Responses are served from local indexes over the data the Hypersnap node has ingested.

## Conventions

- **Base URL:** all paths are relative to the Hypersnap HTTP listener. Examples use `https://haatz.quilibrium.com` as a placeholder.
- **Content type:** responses are always `application/json`.
- **Pagination:** cursor-based; see [Pagination & cursors](../../concepts/pagination.md).
- **Errors:** see [Errors](../../concepts/errors.md). All errors return `{ "message": "..." }`.

## Endpoint groups

- **[Users](./users.md)** — lookup by FID, username, address; bulk; search; verifications; storage.
- **[Casts](./casts.md)** — lookup by hash or URL; bulk; search; conversation threads.
- **[Feeds](./feeds.md)** — default, following, trending, channel feeds.
- **[Channels](./channels.md)** — lookup, all, bulk, search, trending, members, active-for-user.
- **[Reactions](./reactions.md)** — on a cast; from a user.
- **[Follows](./follows.md)** — followers and following lists (aliases available).
- **[User notifications](./notifications.md)** — what another user's feed is doing that's relevant to a given FID (mentions, replies, likes on your casts).
- **[Usernames & proofs](./usernames.md)** — fname availability, username proofs.
- **[Batch reads](./batch.md)** — POST-body hydration for a list of FIDs (follows, reactions, signers, id-registrations, interactions).
