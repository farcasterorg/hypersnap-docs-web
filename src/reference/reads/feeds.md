# Feeds

Feed endpoints return ordered lists of casts. Shape is always:

```json
{ "casts": [ { /* Cast */ } ], "next": { "cursor": "..." } }
```

See [Pagination & cursors](../../concepts/pagination.md) for how to walk large result sets.

---

## GET /v2/farcaster/feed

Generic feed endpoint. Behavior depends on `feed_type`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `feed_type` | string | no | `"following"` (default), `"trending"`, or a future feed type. |
| `fid` | u64 | conditional | Required when `feed_type="following"` — whose feed to render. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed"
     data-title="Try /v2/farcaster/feed"
     data-auth="none"
     data-fields="feed_type|query|string|following or trending|following;fid|query|u64|required when following|3;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/feed/following

Explicit alias of `/feed?feed_type=following`.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

**Semantics** — casts authored by users `fid` follows, ordered newest-first.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed/following"
     data-title="Try /v2/farcaster/feed/following"
     data-auth="none"
     data-fields="fid|query|u64|whose feed||required;limit|query|usize||10;cursor|query|string|pagination cursor"></div>

---

## GET /v2/farcaster/feed/trending

Network-wide trending casts, ranked by an engagement heuristic over a rolling window.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `limit` | usize | no |
| `cursor` | string | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed/trending"
     data-title="Try /v2/farcaster/feed/trending"
     data-auth="none"
     data-fields="limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/feed/channels

Feed of casts parented to one or more channels (either by channel id or by parent URL).

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `channel_ids` | string | yes | Comma-separated channel ids or channel parent URLs. |

**Example**

```bash
curl -s "https://haatz.quilibrium.com/v2/farcaster/feed/channels?channel_ids=memes,base,dev"
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/feed/channels"
     data-title="Try /v2/farcaster/feed/channels"
     data-auth="none"
     data-fields="channel_ids|query|string|comma-separated ids|memes,base,dev|required"></div>
