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

Batch cast lookup by hash list. Also reachable as `GET /v2/farcaster/casts` (spec-style plural), which accepts the same list under the `casts` query parameter instead of `hashes`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `hashes` | string | yes (for `/cast/bulk`) | Comma-separated `0x`-prefixed cast hashes. |
| `casts` | string | yes (for `/casts`) | Same shape — accepted as an alternate parameter name. |

**Response**

```json
{ "casts": [ { "hash": "0x...", "..." : "..." } ] }
```

Each lookup is O(1) via the `cast_hash` index — no shard scan.

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

---

## GET /v2/farcaster/cast/quotes

Casts that quote (embed the `CastId` of) a given cast. Backed by the `CastQuotesIndexer` — a reverse index populated on backfill and kept live.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `identifier` | string | yes | `0x`-prefixed hash of the quoted cast. |
| `type` | `"hash"` | no | Only `hash` is supported. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

**Response**

```json
{ "casts": [ { "hash": "0x...", "..." : "..." } ], "next": { "cursor": null } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast/quotes"
     data-title="Try /v2/farcaster/cast/quotes"
     data-auth="none"
     data-fields="identifier|query|string|0x-prefixed cast hash||required;type|query|string||hash;limit|query|usize||10"></div>

---

## GET /v2/farcaster/cast/metrics

Aggregate cast search volume over a time interval. Currently returns an empty metrics array — per-cast metrics are available via the feed endpoints (which attach likes/recasts/replies counts), but aggregate time-series analytics over arbitrary search queries are not computed on-node.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | string | yes | Search query. |
| `interval` | string | no | `1d`, `7d`, `30d`, `90d`, `180d`. |
| `author_fid` | u64 | no | Narrow to a specific author. |
| `channel_id` | string | no | Narrow to a specific channel. |

**Response**

```json
{ "metrics": [], "next": { "cursor": null } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/cast/metrics"
     data-title="Try /v2/farcaster/cast/metrics"
     data-auth="none"
     data-fields="q|query|string|search query||required;interval|query|string||30d;author_fid|query|u64;channel_id|query|string"></div>

---

## GET /v2/farcaster/cast/conversation/summary

LLM-generated conversation summary. This node does not run an LLM — the endpoint is registered for SDK compatibility and returns a short placeholder string.

**Response**

```json
{ "summary": "Conversation summaries require LLM integration which is not available on this node." }
```

---

## GET /v2/farcaster/cast/embed/crawl

Crawl and extract metadata from an embed URL. URL crawling requires an external HTTP service — not performed on-node. Returns `{ "metadata": null }`.

## Write endpoints

`POST /v2/farcaster/cast` and `DELETE /v2/farcaster/cast` are registered but return `501 Not Implemented`. Submit casts via signed protocol messages through the gRPC `SubmitMessage` endpoint.
