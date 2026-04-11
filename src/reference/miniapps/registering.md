# Registering a mini app

All endpoints in this section are under `/v2/farcaster/frame/app/` and require an [EIP-712 signature](../../concepts/authentication.md) from your FID's custody key. Max body: **32 KB**.

The server assigns a random 16-character base58 `app_id` (~93 bits of entropy) and a fresh send secret at create time. These are what you use in the URL paths for the token webhook and send endpoints.

---

## POST /v2/farcaster/frame/app/ — create

`X-Hypersnap-Op`: `app.create`

**Request body** (`CreateAppRequest`):

```json
{
  "name": "my mini app",
  "app_url": "https://miniapp.example.com",
  "description": "optional",
  "signer_fid_allowlist": [12345, 67890]
}
```

| Field | Type | Notes |
|---|---|---|
| `name` | string | 1–128 chars. Human-readable, shown in management responses. |
| `app_url` | string | Canonical mini-app URL. SSRF-checked at create time. Hypersnap never POSTs to this URL itself — it's informational. |
| `description` | string (optional) | Free-form. |
| `signer_fid_allowlist` | `Vec<u64>` (optional) | FIDs whose Farcaster signing keys are permitted to submit JFS token events for this app. Empty = any active signer is accepted. Capped at 1024 entries. |

**Response** (`AppResponse`):

```json
{
  "app": {
    "app_id": "3Hq9ZgK2p4vNfWxR",
    "owner_fid": 12345,
    "name": "my mini app",
    "app_url": "https://miniapp.example.com",
    "description": "optional",
    "signer_fid_allowlist": [],
    "send_secrets": [
      {
        "uid": "uuid",
        "value": "<64-char hex send secret>",
        "expires_at": null,
        "created_at": 1712345678
      }
    ],
    "created_at": 1712345678,
    "updated_at": 1712345678
  }
}
```

**Save `app.app_id` and `app.send_secrets[0].value`.** You'll need:

- `app_id` in the URL path for the token webhook (`/v2/farcaster/frame/webhook/<app_id>`) and the send endpoint (`/v2/farcaster/frame/notifications/<app_id>`).
- `send_secrets[0].value` as the `x-api-key` header when you call the send endpoint.

**Errors**

- `400` — invalid name / app_url / SSRF-blocked URL / allowlist too big.
- `401` — signature / auth failure.
- `429` — per-FID app cap hit.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/app/"
     data-title="Try app.create"
     data-op="app.create"
     data-body-template='{
  "name": "my playground app",
  "app_url": "https://miniapp.example.com",
  "signer_fid_allowlist": []
}'></div>

---

## GET /v2/farcaster/frame/app/ — lookup

`X-Hypersnap-Op`: `app.read`

**Query**

| Name | Type | Required |
|---|---|---|
| `app_id` | string | yes |

**Response** — same `AppResponse` shape. `403` if the app belongs to a different FID; `404` if not found.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/frame/app/"
     data-title="Try app.read (lookup)"
     data-op="app.read"
     data-fields="app_id|query|string|16-char base58 id||required"></div>

---

## GET /v2/farcaster/frame/app/list — list

`X-Hypersnap-Op`: `app.read`

**Query** — none.

**Response**

```json
{ "apps": [ { /* RegisteredApp */ } ] }
```

Returns every mini app owned by the signing FID.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/frame/app/list"
     data-title="Try app.read (list)"
     data-op="app.read"></div>

---

## PUT /v2/farcaster/frame/app/ — update

`X-Hypersnap-Op`: `app.update`

**Request body** (`UpdateAppRequest`):

```json
{
  "app_id": "3Hq9ZgK2p4vNfWxR",
  "name": "optional new name",
  "app_url": "https://new.example.com",
  "description": "optional",
  "signer_fid_allowlist": [12345]
}
```

Only supplied fields change. Passing `signer_fid_allowlist` replaces the whole list.

<div class="try-it"
     data-method="PUT"
     data-path="/v2/farcaster/frame/app/"
     data-title="Try app.update"
     data-op="app.update"
     data-body-template='{
  "app_id": "REPLACE-WITH-EXISTING-APP-ID",
  "description": "updated from the playground"
}'></div>

---

## DELETE /v2/farcaster/frame/app/ — delete

`X-Hypersnap-Op`: `app.delete`

**Query**

| Name | Type | Required |
|---|---|---|
| `app_id` | string | yes |

**Response**

```json
{ "deleted": true }
```

After deletion, both the send endpoint and the client token webhook return `404` for this `app_id`. Previously registered notification tokens become unreachable (the token store still holds them but nothing reads them).

<div class="try-it"
     data-method="DELETE"
     data-path="/v2/farcaster/frame/app/"
     data-title="Try app.delete"
     data-op="app.delete"
     data-fields="app_id|query|string|16-char base58 id||required"></div>

---

## POST /v2/farcaster/frame/app/secret/rotate — rotate send secret

`X-Hypersnap-Op`: `app.rotate_secret`

**Query**

| Name | Type | Required |
|---|---|---|
| `app_id` | string | yes |

**Response** — the full `AppResponse`. `send_secrets` has one new entry appended (the newest) and previously-active secrets have `expires_at` set to `now + secret_grace_period_secs` (default 24h).

**How to use rotation:**

1. Call `/secret/rotate`.
2. Read the new secret from `send_secrets[-1].value`.
3. Deploy the new secret to your backend.
4. The old secret keeps working until the grace window passes, so you don't have a downtime window during the rollout.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/frame/app/secret/rotate"
     data-title="Try app.rotate_secret"
     data-op="app.rotate_secret"
     data-fields="app_id|query|string|16-char base58 id||required"></div>
