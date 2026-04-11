# Build a Farcaster client

A minimal Farcaster client needs to answer four questions about the current user and the network:

1. Who is this user? (profile, verifications, stats)
2. What's in their feed? (casts from people they follow, trending)
3. What's happening to them? (mentions, replies, reactions on their casts)
4. What do the things in their feed look like? (casts, authors, thread context)

Every one of these is a single unauthenticated GET against a Hypersnap node.

## 1. Profile screen

```bash
# Basic user info
GET /v2/farcaster/user?fid=12345

# Or by username
GET /v2/farcaster/user/by-username?username=alice
```

One of these, plus:

```bash
# Follower / following counts are included on the User object.
# If you want the actual lists:
GET /v2/farcaster/user/followers?fid=12345&limit=50
GET /v2/farcaster/user/following?fid=12345&limit=50
```

## 2. Home feed

Two options depending on what "home" means in your app:

```bash
# Following feed — casts from people the user follows
GET /v2/farcaster/feed/following?fid=12345&limit=20

# Trending feed — what the network is engaging with
GET /v2/farcaster/feed/trending?limit=20
```

Both return cursor-paginated `{ casts: [...], next: { cursor } }`. See [Pagination](../concepts/pagination.md).

## 3. Notifications tab

```bash
GET /v2/farcaster/notifications?fid=12345&limit=20
```

Returns aggregated notification rows — mentions, replies, reactions, follows. The `type` field discriminates the kind.

## 4. Rendering a single cast

When the user taps a cast, fetch its thread:

```bash
GET /v2/farcaster/cast/conversation?identifier=0xabc...&type=hash&reply_depth=3
```

You get the root cast plus nested replies up to `reply_depth` (max 5). This is enough to render a thread view without additional roundtrips.

## 5. Who liked this cast?

```bash
GET /v2/farcaster/reaction/cast?hash=0xabc...&types=likes
GET /v2/farcaster/reaction/cast?hash=0xabc...&types=recasts
```

## 6. Making "you liked this" work across a feed

Rather than one lookup per cast, use the batch endpoint:

```bash
POST /v2/farcaster/batch/cast-interactions
Content-Type: application/json

{ "fids": [12345] }
```

Response:

```json
{
  "12345": [
    { "hash": "0xabc", "liked": true, "recasted": false, "replied": true }
  ]
}
```

Then annotate your cached feed cards locally.

## 7. Search

```bash
# Cast search
GET /v2/farcaster/cast/search?q=hypersnap&limit=20

# User search (prefix match on username)
GET /v2/farcaster/user/search?q=alice

# Channel search
GET /v2/farcaster/channel/search?q=base
```

## 8. Channels

```bash
# Channel profile
GET /v2/farcaster/channel?id=memes

# Channel feed (parent-scoped casts)
GET /v2/farcaster/feed/channels?channel_ids=memes

# Channel members
GET /v2/farcaster/channel/members?channel_id=memes&limit=50
```

## That's the whole client

Seriously — those are the endpoints. Everything else in the [Read API reference](../reference/reads/index.md) is either a nice-to-have (storage, username proofs, verifications, trending channels) or a batch-hydration shortcut for when you have a list of FIDs or cast hashes and want to enrich them in one call.

## What you *don't* do

- **You don't submit casts through this API.** Cast/reaction/follow message submission uses the Farcaster protobuf wire format over gRPC. See the upstream [Farcaster protocol docs](https://github.com/farcasterxyz/protocol).
- **You don't need auth.** All the endpoints above are public. If you find yourself needing an API key, double-check — you probably don't.
- **You don't need to poll for new events.** If you want realtime, register a [webhook](../reference/webhooks/index.md). If you're building a read-only client, periodic refresh is fine.

## Recommended cache strategy

Hypersnap serves reads from local indexes and is fast enough that you can go to the server for most things. Still, be nice:

- Cache `User` objects for ~1 minute. Follower/following counts don't need to be perfectly fresh.
- Cache `Cast` objects for longer — they're immutable after creation. Reactions on them are the thing that changes.
- Invalidate on explicit user action (posting a cast, following someone, liking something).
- Use `Cache-Control` / `ETag` at your edge if you have one.

## Next step

When you want realtime updates instead of pulling, jump to [Build an agent](./build-an-agent.md).
