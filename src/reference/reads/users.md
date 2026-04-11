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

Look up a user by username. Accepts fnames, ENS names, and Basenames — whatever resolves through the username-proof table.

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
