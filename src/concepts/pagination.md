# Pagination & cursors

List endpoints return up to `limit` items (default `10`) plus a `next` object with a cursor for the next page:

```json
{
  "users": [ /* ... */ ],
  "next": { "cursor": "50" }
}
```

## Contract

- **`limit`** is a query parameter. If you omit it, you get 10 items.
- **`cursor`** is an opaque string. You pass whatever the previous response gave you in `next.cursor` back as the `cursor` query param.
- **End of results** is signaled either by an empty `next` (null cursor) or by a response shorter than `limit`.

```bash
# Page 1
curl -s "https://haatz.quilibrium.com/v2/farcaster/user/followers?fid=3&limit=50" | jq '.next.cursor'
# "50"

# Page 2
curl -s "https://haatz.quilibrium.com/v2/farcaster/user/followers?fid=3&limit=50&cursor=50" | jq '.next.cursor'
# "100"
```

## What cursors actually are

For most list endpoints in Hypersnap, cursors today are stringified u64 offsets into the underlying index. **Treat them as opaque anyway** — different endpoints may encode cursors differently, and future versions may switch to a more complex scheme. If you need to persist a position for later (resume scrolling), store the full cursor string verbatim.

## Limit caps

Each endpoint has its own sanity cap — we don't document them exhaustively but in practice anything above `100` is unlikely to be honored. If you need to walk an entire result set, loop with a reasonable page size (e.g. `50`) rather than asking for thousands at once.

## List endpoints that accept `cursor`

- `GET /v2/farcaster/feed`, `/feed/following`, `/feed/trending`, `/feed/channels`
- `GET /v2/farcaster/user/followers`, `/user/following`
- `GET /v2/farcaster/cast/search`
- `GET /v2/farcaster/channel/all`, `/channel/bulk`, `/channel/members`, `/channel/user-active`
- `GET /v2/farcaster/notifications`
- `GET /v2/farcaster/reaction/cast`, `/reaction/user`

Endpoints like `/user/bulk`, `/cast/bulk`, or channel lookups that take a comma-separated id list don't paginate — you pass the full set of ids and get back everything in a single response.
