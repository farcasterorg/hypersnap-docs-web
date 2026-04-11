# Casts

Casts are Farcaster messages — the core unit of user-generated content. Hypersnap serves them directly from its local RocksDB indexes over the message store.

The common `Cast` response shape includes `hash`, `author` (full `User`), `text`, `timestamp`, `parent_hash`, `parent_url`, `root_parent_url`, `embeds`, `mentioned_profiles`, `reactions` (aggregate counts), and `replies.count`. See `src/api/types.rs` for the complete type.

---

## GET /v2/farcaster/cast

Look up a single cast by hash or URL.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | yes | Either a `0x`-prefixed cast hash or a Warpcast-style URL. |
| `type` | `"hash"` \| `"url"` | no | Defaults to `"hash"`. |
| `fid` | u64 | no | When `type="hash"` and the hash is ambiguous, narrows to a specific author. |

**Response**

```json
{ "cast": { "hash": "0x...", "author": { ... }, "text": "...", "..." : "..." } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast"
     data-title="Try /v2/farcaster/cast"
     data-auth="none"
     data-fields="identifier|query|string|0x-prefixed hash or URL||required;type|query|string|hash or url|hash"></div>

---

## GET /v2/farcaster/cast/bulk

Batch cast lookup by hash list.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `hashes` | string | yes | Comma-separated `0x`-prefixed cast hashes. |

**Response**

```json
{ "casts": [ { "hash": "0x...", "..." : "..." } ] }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast/bulk"
     data-title="Try /v2/farcaster/cast/bulk"
     data-auth="none"
     data-fields="hashes|query|string|comma-separated 0x hashes||required"></div>

---

## GET /v2/farcaster/cast/search

Full-text search over cast content.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | string | yes | Search query. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

**Response**

```json
{ "casts": [ ... ], "next": { "cursor": "..." } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast/search"
     data-title="Try /v2/farcaster/cast/search"
     data-auth="none"
     data-fields="q|query|string|query text||required;limit|query|usize||10;cursor|query|string|pagination cursor"></div>

---

## GET /v2/farcaster/cast/conversation

Fetch a cast plus its reply tree up to a given depth. Ideal for rendering a thread view.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | yes | Root cast hash or URL. |
| `type` | `"hash"` \| `"url"` | yes | Disambiguate what `identifier` is. |
| `reply_depth` | u32 | no | `0`–`5`, default `2`. How many levels of replies to include. |

**Response**

```json
{
  "cast": { "hash": "0x...", "..." : "..." },
  "replies": [
    {
      "cast": { "hash": "0x...", "..." : "..." },
      "replies": [ /* same recursive shape, up to reply_depth */ ]
    }
  ]
}
```

The top-level `cast` is the thread root. Each reply node has its own `cast` plus a nested `replies` array. Depth is capped at 5 to keep responses bounded.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast/conversation"
     data-title="Try /v2/farcaster/cast/conversation"
     data-auth="none"
     data-fields="identifier|query|string|0x hash or URL||required;type|query|string|hash or url|hash|required;reply_depth|query|u32|0 through 5|2"></div>
