# Subscription filters

A `WebhookSubscription` object selects which Farcaster events you want delivered. The shape mirrors common Farcaster v2 contracts so existing filters port verbatim.

## Top-level shape

```json
{
  "cast_created":    { /* CastFilter */ },
  "cast_deleted":    { /* CastFilter */ },
  "user_created":    { },
  "user_updated":    { "fids": [12345] },
  "follow_created":  { "fids": [], "target_fids": [] },
  "follow_deleted":  { "fids": [], "target_fids": [] },
  "reaction_created":{ "fids": [], "target_fids": [], "target_cast_hashes": [] },
  "reaction_deleted":{ "fids": [], "target_fids": [], "target_cast_hashes": [] }
}
```

**At least one event must be present.** Creating a webhook with an empty subscription returns `400`.

Any filter object can be omitted or included as `{}` to subscribe to everything of that event type.

## CastFilter

Used for both `cast_created` and `cast_deleted`.

| Field | Type | Meaning |
|---|---|---|
| `author_fids` | `Vec<u64>` | Cast author FID is in this set. |
| `exclude_author_fids` | `Vec<u64>` | Cast author FID is **not** in this set. |
| `mentioned_fids` | `Vec<u64>` | Cast mentions any FID in this set. |
| `parent_urls` | `Vec<String>` | Cast is a reply under one of these parent URLs (channel scoping). |
| `root_parent_urls` | `Vec<String>` | Root-of-thread parent URL matches. (Accepted at create time; not enforced at dispatch.) |
| `parent_hashes` | `Vec<String>` | Cast is a reply to a cast with one of these hashes. |
| `parent_author_fids` | `Vec<u64>` | Cast is a reply to a cast authored by one of these FIDs. |
| `text` | `Option<String>` | Regex. If set, cast `text` must match. Compiled at create time with the linear-time `regex` crate; lookaround is rejected. |
| `embeds` | `Option<String>` | Regex. Applied against embed URLs. (Accepted at create time; not enforced at dispatch.) |
| `embedded_cast_author_fids` | `Vec<u64>` | (Accepted; not enforced at dispatch.) |
| `embedded_cast_hashes` | `Vec<String>` | (Accepted; not enforced at dispatch.) |

**All supplied fields AND together.** If you set both `author_fids` and `mentioned_fids`, the cast must match both. Arrays OR within themselves — `author_fids: [3, 5]` matches a cast by FID 3 *or* 5.

An empty array means "no restriction on this field", not "nothing matches".

## FollowFilter

Used for both `follow_created` and `follow_deleted`.

| Field | Type | Meaning |
|---|---|---|
| `fids` | `Vec<u64>` | The follower's FID is in this set. |
| `target_fids` | `Vec<u64>` | The target (the one being followed) is in this set. |

## ReactionFilter

Used for both `reaction_created` and `reaction_deleted`.

| Field | Type | Meaning |
|---|---|---|
| `fids` | `Vec<u64>` | The reactor's FID is in this set. |
| `target_fids` | `Vec<u64>` | The author of the cast being reacted to is in this set. |
| `target_cast_hashes` | `Vec<String>` | The specific cast hash(es) being reacted to. |

## UserUpdatedFilter

| Field | Type | Meaning |
|---|---|---|
| `fids` | `Vec<u64>` | Only match updates to these FIDs. |

## UserCreatedFilter

No filter fields — fires for every new FID registration seen on-chain.

## Size caps

- Every array field is capped at **1024** entries. Exceeding the cap rejects the create/update with `400`.
- Regex patterns (`text`, `embeds`) must compile under Rust's `regex` crate (linear time, no backtracking). Lookaround is rejected. Alternation, character classes, and quantifiers all work.

## Fields accepted but not enforced at dispatch

A handful of filter fields (`root_parent_urls`, `embeds` regex, `embedded_cast_*`) are parsed and validated at create time but not used to filter events when they're dispatched. They require cross-message lookups that aren't on the dispatcher's hot path today. Setting them is harmless — events still fire — but they won't narrow your stream. If you need a tighter filter than the enforced fields can express, filter in your receiver and ignore the overdelivered events.

## Examples

### Every new cast network-wide

```json
{ "cast_created": {} }
```

### Casts authored by a specific FID

```json
{ "cast_created": { "author_fids": [3] } }
```

### Casts that mention your FID OR are replies to you

```json
{
  "cast_created": {
    "mentioned_fids": [12345],
    "parent_author_fids": [12345]
  }
}
```

**Caveat:** that filter uses AND semantics across fields, so it matches casts that both mention *and* reply to you. To OR the two conditions, register two webhooks (or two subscriptions on the same webhook) and dedupe on the receiver side.

### Likes on your casts

```json
{ "reaction_created": { "target_fids": [12345] } }
```

### New follows where you are the target

```json
{ "follow_created": { "target_fids": [12345] } }
```

### Keyword filter

```json
{ "cast_created": { "text": "(?i)\\b(hypersnap|farcaster)\\b" } }
```

`(?i)` is supported; `(?=...)` / `(?!...)` lookaround is not.
