# Blocks, Mutes, Bans

Block and mute state is expressed in the Farcaster protocol as `LinkAdd` messages with a non-follow `link_type` (`"block"` or `"mute"`). Hypersnap surfaces the current block/mute list for a given FID by querying the `LinkStore` directly.

Ban lists are **app-level**, not protocol-level — they do not exist in the Farcaster protocol and the corresponding endpoint returns an empty list.

Response shape for all list endpoints:

```json
{
  "users": [ { /* User */ } ],
  "next": { "cursor": null }
}
```

---

## GET /v2/farcaster/block/list

FIDs that `fid` has blocked.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |

Backed by `LinkStore::get_link_adds_by_fid(fid, "block", ...)` — a direct index lookup, no scan.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/block/list"
     data-title="Try /v2/farcaster/block/list"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10"></div>

---

## GET /v2/farcaster/mute/list

FIDs that `fid` has muted.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |

Backed by `LinkStore::get_link_adds_by_fid(fid, "mute", ...)`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/mute/list"
     data-title="Try /v2/farcaster/mute/list"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10"></div>

---

## GET /v2/farcaster/ban/list

Registered for SDK compatibility — bans are an app-level concept and not part of the Farcaster protocol.

**Response**

```json
{ "bans": [], "next": { "cursor": null } }
```

## Write endpoints

`POST /v2/farcaster/block`, `DELETE /v2/farcaster/block`, `POST /v2/farcaster/mute`, `DELETE /v2/farcaster/mute`, `POST /v2/farcaster/ban`, and `DELETE /v2/farcaster/ban` are registered but return `501 Not Implemented`. Submit signed `LinkAdd`/`LinkRemove` messages with `link_type = "block"` or `"mute"` via gRPC `SubmitMessage`.
