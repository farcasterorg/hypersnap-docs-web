# Follows

Who follows whom, with cursor pagination.

Response shape:

```json
{
  "users": [ { /* User */ } ],
  "next": { "cursor": "..." }
}
```

---

## GET /v2/farcaster/user/followers

Users who follow `fid`. Also reachable as the alias `GET /v2/farcaster/followers`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | Whose followers to list. |
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Pagination cursor. |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/followers"
     data-title="Try /v2/farcaster/user/followers"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/user/following

Users that `fid` follows. Also reachable as `GET /v2/farcaster/following` and `GET /v2/farcaster/follows` (spec-compat aliases).

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The follower. |
| `limit` | usize | no | |
| `cursor` | string | no | |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/following"
     data-title="Try /v2/farcaster/user/following"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/followers/relevant

Users who follow `fid` with relevance-style context. Relevance scoring is not implemented on-node, so this endpoint returns the same data as `/user/followers` (for SDK compatibility).

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/followers/relevant"
     data-title="Try /v2/farcaster/followers/relevant"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/followers/reciprocal

Users where `fid` both follows and is followed by them (mutual follows). Computed on-demand from the social graph — iterates the followers list and filters each entry through `are_mutual_follows()`.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/followers/reciprocal"
     data-title="Try /v2/farcaster/followers/reciprocal"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/following/suggested

Suggested follows computed via friends-of-friends: who the people `fid` follows are also following, ranked by overlap frequency, excluding already-followed users.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no | Default `10`. |

**Response** — `FollowersResponse`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/following/suggested"
     data-title="Try /v2/farcaster/following/suggested"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10"></div>

## Write endpoints

`POST /v2/farcaster/follow`, `DELETE /v2/farcaster/follow`, `POST /v2/farcaster/user/follow`, and `DELETE /v2/farcaster/user/follow` are registered but return `501 Not Implemented`. Submit signed `LinkAdd`/`LinkRemove` messages via the gRPC `SubmitMessage` endpoint.
