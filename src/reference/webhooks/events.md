# Event schemas

The `data` field of a delivered webhook envelope carries a type-specific payload. The `type` field in the envelope tells you which schema applies:

```json
{
  "created_at": 1712345678,
  "type": "cast.created",
  "data": { /* see below */ }
}
```

Hypersnap fires the following event types. Field shapes mirror common Farcaster v2 contracts so existing client models deserialize directly.

---

## cast.created

Emitted when a new cast is ingested by the node.

```json
{
  "type": "cast.created",
  "data": {
    "cast": {
      "hash": "0x...",
      "author": { /* User */ },
      "text": "hello world",
      "timestamp": 1712345678,
      "parent_hash": null,
      "parent_url": null,
      "root_parent_url": null,
      "embeds": [],
      "mentioned_profiles": [],
      "reactions": { "likes_count": 0, "recasts_count": 0 },
      "replies": { "count": 0 }
    }
  }
}
```

## cast.deleted

Emitted when a cast delete message is applied.

```json
{
  "type": "cast.deleted",
  "data": {
    "cast": { /* Same cast shape as cast.created */ }
  }
}
```

## user.created

Emitted on an `IdRegistry` register event seen on-chain. No filter fields.

```json
{
  "type": "user.created",
  "data": {
    "user": { "fid": 12345, "username": null, "..." : "..." }
  }
}
```

## user.updated

Emitted when user-data (pfp, bio, display name, url, username) changes.

```json
{
  "type": "user.updated",
  "data": {
    "user": { /* User (updated fields filled) */ }
  }
}
```

## follow.created

Emitted when a `link_add` message with type `follow` is applied.

```json
{
  "type": "follow.created",
  "data": {
    "follower": { /* User */ },
    "target":   { /* User */ }
  }
}
```

## follow.deleted

Emitted on `link_remove` for a follow link.

```json
{
  "type": "follow.deleted",
  "data": {
    "follower": { /* User */ },
    "target":   { /* User */ }
  }
}
```

## reaction.created

Emitted when a like or recast is applied.

```json
{
  "type": "reaction.created",
  "data": {
    "reaction_type": "like",
    "user":  { /* User */ },
    "cast":  { /* Cast */ }
  }
}
```

`reaction_type` is either `"like"` or `"recast"`.

## reaction.deleted

Same shape as `reaction.created`, emitted when a reaction is removed.

---

## Dedupe keys

For at-least-once delivery, dedupe on the natural key of each event type:

| Event | Dedupe key |
|---|---|
| `cast.created` / `cast.deleted` | `data.cast.hash` |
| `user.created` | `data.user.fid` |
| `user.updated` | `(data.user.fid, received_at)` or compare fields against last-known state |
| `follow.created` / `follow.deleted` | `(data.follower.fid, data.target.fid)` |
| `reaction.created` / `reaction.deleted` | `(data.user.fid, data.cast.hash, data.reaction_type)` |

## Forward compatibility

- New optional fields can appear on existing event payloads. Don't error on unknown fields.
- New event types can be added. Subscribe only to the types you know; ignore unfamiliar `type` values your code doesn't recognize.
- Event field semantics won't change for an existing `type`.
