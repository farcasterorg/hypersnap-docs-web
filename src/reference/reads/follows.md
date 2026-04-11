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

Users that `fid` follows. Also reachable as the alias `GET /v2/farcaster/following`.

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
