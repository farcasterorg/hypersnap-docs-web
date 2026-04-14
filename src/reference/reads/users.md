# Users

All user endpoints return (or contain) the shared `User` object. See `src/api/types.rs` for the full field list; common fields include `fid`, `username`, `display_name`, `pfp_url`, `profile.bio`, `follower_count`, `following_count`, `verified_addresses`, and `power_badge`.

---

## GET /v2/farcaster/user

Look up a single user by FID.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The FID to fetch. |

**Response**

```json
{ "user": { "fid": 3, "username": "dwr.eth", "..." : "..." } }
```

**Example**

```bash
curl -s "https://haatz.quilibrium.com/v2/farcaster/user?fid=3"
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user"
     data-title="Try /v2/farcaster/user"
     data-auth="none"
     data-fields="fid|query|u64|e.g. 3|3|required"></div>

---

## GET /v2/farcaster/user/bulk

Batch lookup by FID list.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fids` | string | yes | Comma-separated list of FIDs, e.g. `3,5,191` |

**Response**

```json
{ "users": [ { "fid": 3, "..." : "..." }, { "fid": 5, "..." : "..." } ] }
```

Missing FIDs are silently omitted from the response — if you asked for 3 fids and only 2 exist, you get 2 objects back, not a 404.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/bulk"
     data-title="Try /v2/farcaster/user/bulk"
     data-auth="none"
     data-fields="fids|query|string|e.g. 3,5,191|3,5,191|required"></div>

---

## GET /v2/farcaster/user/bulk-by-address

Batch lookup by verified Ethereum address.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `addresses` | string | yes | Comma-separated 0x-addresses. Matches against `User.verified_addresses.eth_addresses`. |

**Response** — same `BulkUsersResponse` shape.

Addresses that aren't verified against any FID are silently omitted.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/bulk-by-address"
     data-title="Try /v2/farcaster/user/bulk-by-address"
     data-auth="none"
     data-fields="addresses|query|string|comma-separated 0x addresses||required"></div>

---

## GET /v2/farcaster/user/by-username

Look up a user by username. Accepts fnames, ENS names, and Basenames — whatever resolves through the username-proof table. Also reachable as `GET /v2/farcaster/user/by_username` (underscore variant).

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | Case-sensitive. Without a leading `@`. |

**Response** — single `UserResponse`. `404` if the name isn't registered.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/by-username"
     data-title="Try /v2/farcaster/user/by-username"
     data-auth="none"
     data-fields="username|query|string|e.g. dwr.eth|dwr.eth|required"></div>

---

## GET /v2/farcaster/user/custody-address

Reverse-lookup: find the user whose custody Ethereum address matches.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `custody_address` | string | yes | `0x`-prefixed Ethereum address. |

**Response** — `UserResponse`. `404` if no FID is registered to that address. If multiple FIDs share the address (legacy), the first is returned.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/custody-address"
     data-title="Try /v2/farcaster/user/custody-address"
     data-auth="none"
     data-fields="custody_address|query|string|0x-prefixed address||required"></div>

---

## GET /v2/farcaster/user/by_x_username

Look up an FID by the user's self-declared X/Twitter username. Backed by a reverse index built from `UserDataAdd` messages of type `USER_DATA_TYPE_TWITTER`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | Case-insensitive match against the stored X username. |

**Response** — `UserResponse`. `404` if no user has that X username registered.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/by_x_username"
     data-title="Try /v2/farcaster/user/by_x_username"
     data-auth="none"
     data-fields="username|query|string|X/Twitter username||required"></div>

---

## GET /v2/farcaster/user/by_location

Find users whose declared location matches a prefix. Backed by a reverse index built from `UserDataAdd` messages of type `USER_DATA_TYPE_LOCATION`.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `location` | string | yes | Prefix-match against the stored location string (case-insensitive). |
| `limit` | usize | no | Default `10`. |

**Response** — `BulkUsersResponse`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/by_location"
     data-title="Try /v2/farcaster/user/by_location"
     data-auth="none"
     data-fields="location|query|string|e.g. brooklyn||required;limit|query|usize||10"></div>

---

## GET /v2/farcaster/user/search

Prefix-style search against the username index.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | string | yes | Search query. |
| `limit` | usize | no | Default `10`. |

**Response** — `BulkUsersResponse`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/search"
     data-title="Try /v2/farcaster/user/search"
     data-auth="none"
     data-fields="q|query|string|query text||required;limit|query|usize||10"></div>

---

## GET /v2/farcaster/user/verifications

Returns the same `User` object as `/v2/farcaster/user`, with the `verified_addresses` section populated. Provided as an alias for callers that want to signal intent.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/verifications"
     data-title="Try /v2/farcaster/user/verifications"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

---

## GET /v2/farcaster/user/storage-allocations

How much Farcaster storage an FID currently has allocated to it.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |

**Response**

```json
{
  "total_active_units": 2,
  "allocations": [
    {
      "object": "storage_allocation",
      "fid": 3,
      "units": 2,
      "expiry": 1760000000,
      "timestamp": 1700000000
    }
  ]
}
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/storage-allocations"
     data-title="Try /v2/farcaster/user/storage-allocations"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

---

## GET /v2/farcaster/user/storage-usage

How much of the allocated storage the FID has actually consumed, broken down by message type.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |

**Response**

```json
{
  "object": "storage_usage",
  "units": [
    { "store_type": "casts",       "used": 250, "capacity": 5000 },
    { "store_type": "reactions",   "used": 800, "capacity": 2500 },
    { "store_type": "links",       "used": 300, "capacity": 2500 },
    { "store_type": "verifications", "used": 1, "capacity": 25 }
  ]
}
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/storage-usage"
     data-title="Try /v2/farcaster/user/storage-usage"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

Also reachable as `GET /v2/farcaster/storage/usage` and `GET /v2/farcaster/storage/allocations` — identical behavior, different paths.

---

## GET /v2/farcaster/user/fid

List registered FIDs on the network, paginated.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `limit` | usize | no | Default `10`. |
| `cursor` | string | no | Hex-encoded pagination cursor. |

**Response**

```json
{ "fids": [1, 2, 3], "next": { "cursor": "..." } }
```

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/fid"
     data-title="Try /v2/farcaster/user/fid"
     data-auth="none"
     data-fields="limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/user/channels

Channels a user has recently been active in. Alias of `GET /v2/farcaster/channel/user-active`.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

**Response** — `ChannelsResponse`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/channels"
     data-title="Try /v2/farcaster/user/channels"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/user/memberships/list

Alias of `GET /v2/farcaster/user/channels` — returns the same active-channels list in a membership-oriented response shape.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/memberships/list"
     data-title="Try /v2/farcaster/user/memberships/list"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/user/best_friends

Users that both follow and are followed by `fid` — the intersection. Sorted by most recent mutual follow.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |
| `limit` | usize | no |
| `cursor` | string | no |

**Response** — `FollowersResponse`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/best_friends"
     data-title="Try /v2/farcaster/user/best_friends"
     data-auth="none"
     data-fields="fid|query|u64||3|required;limit|query|usize||10;cursor|query|string"></div>

---

## GET /v2/farcaster/user/interactions

Summarize the interaction history between two FIDs: mention counts, reaction counts, mutual-follow state.

**Query parameters**

| Name | Type | Required | Notes |
|---|---|---|---|
| `fid` | u64 | yes | The "from" user. |
| `target_fid` | u64 | no | The "to" user. If omitted, an empty summary is returned. |

**Response**

```json
{
  "interactions": {
    "fid": 3,
    "target_fid": 5,
    "mentions": 7,
    "reactions": 42,
    "mutual_follow": true
  }
}
```

Mentions are computed from the `CastsByMention` index (casts by `fid` that mention `target_fid`). Reactions are computed from the reactor's reaction set. Mutual-follow is a single index lookup.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/user/interactions"
     data-title="Try /v2/farcaster/user/interactions"
     data-auth="none"
     data-fields="fid|query|u64||3|required;target_fid|query|u64||5"></div>

---

## Endpoints with no protocol data

The following endpoints are registered for SDK compatibility but return empty responses because the Farcaster protocol does not track the underlying data:

| Path | Returns | Why |
|---|---|---|
| `GET /v2/farcaster/user/power_users` | `{ "users": [] }` | Power-user curation is a proprietary scoring signal, not protocol data. |
| `GET /v2/farcaster/user/balance` | `{ "balances": [], "next": { "cursor": null } }` | Token balances are on-chain state outside the Farcaster protocol. |
| `GET /v2/farcaster/user/subscribed_to` | `{ "subscriptions": [], "next": { "cursor": null } }` | User-to-user subscriptions are not in the protocol. |
| `GET /v2/farcaster/user/subscribers` | `{ "subscriptions": [], "next": { "cursor": null } }` | Same as above. |
| `GET /v2/farcaster/user/subscriptions_created` | `{ "subscriptions": [], "next": { "cursor": null } }` | Same as above. |

## Write endpoints

Endpoints that mutate user state (`POST /v2/farcaster/user/register`, `POST /v2/farcaster/user/follow`, `DELETE /v2/farcaster/user/follow`, `POST /v2/farcaster/user/verification`, `DELETE /v2/farcaster/user/verification`, `PATCH /v2/farcaster/user`) are registered but return `501 Not Implemented`. Write operations require submitting a signed Farcaster protocol message via the gRPC `SubmitMessage` endpoint instead.
