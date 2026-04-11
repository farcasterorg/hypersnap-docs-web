# Channels

Farcaster channels are parent-URL-scoped subcommunities. Hypersnap maintains a local channel registry and membership index.

Common `Channel` fields: `id`, `parent_url`, `name`, `image_url`, `description`, `lead` (the channel host's `User`), `moderator_fids`, `follower_count`, `created_at`.

---

## GET /v2/farcaster/channel

Look up a single channel.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Either the channel id (e.g. `memes`) or the parent URL. |
| `type` | `"id"` \| `"parent_url"` | no | Default `"id"`. |

**Response**

```json
{ "channel": { "id": "memes", "..." : "..." } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel"
     data-title="Try /v2/farcaster/channel"
     data-auth="none"
     data-fields="id|query|string|channel id|memes|required;type|query|string|id or parent_url|id"></div>

---

## GET /v2/farcaster/channel/all

List every channel the node knows about.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `limit` | usize | no |
| `cursor` | string | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/all"
     data-title="Try /v2/farcaster/channel/all"
     data-auth="none"
     data-fields="limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/channel/bulk

Batch channel lookup.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `ids` | string | yes | Comma-separated channel ids. |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/bulk"
     data-title="Try /v2/farcaster/channel/bulk"
     data-auth="none"
     data-fields="ids|query|string|comma-separated channel ids|memes,base,dev|required"></div>

---

## GET /v2/farcaster/channel/search

Prefix-style search against the channel name index.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `q` | string | yes |
| `limit` | usize | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/search"
     data-title="Try /v2/farcaster/channel/search"
     data-auth="none"
     data-fields="q|query|string|query text||required;limit|query|usize||10"></div>

---

## GET /v2/farcaster/channel/trending

Channels with the most engagement over a rolling window.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `limit` | usize | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/trending"
     data-title="Try /v2/farcaster/channel/trending"
     data-auth="none"
     data-fields="limit|query|usize||10"></div>

---

## GET /v2/farcaster/channel/members

Members of a specific channel. Also reachable as `/v2/farcaster/channel/member/list`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `channel_id` | string | yes | The channel id. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

**Response**

```json
{ "users": [ { /* User */ } ], "next": { "cursor": "..." } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/members"
     data-title="Try /v2/farcaster/channel/members"
     data-auth="none"
     data-fields="channel_id|query|string||memes|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/channel/user-active

Channels where a specific user has recently been active.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/channel/user-active"
     data-title="Try /v2/farcaster/channel/user-active"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>
