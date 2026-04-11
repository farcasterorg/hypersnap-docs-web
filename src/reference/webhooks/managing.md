# Managing webhooks

All endpoints under `/v2/farcaster/webhook/*` require an EIP-712 signature in headers as described in [Signed operations](../../concepts/authentication.md). The request body (if any) is included verbatim in the hash that gets signed.

Max body: **256 KB**.

---

## POST /v2/farcaster/webhook/ — create

`X-Hypersnap-Op`: `webhook.create`

**Request body** (`CreateWebhookRequest`):

```json
{
  "name": "my webhook",
  "url": "https://receiver.example.com/hook",
  "description": "optional free-form",
  "subscription": {
    "cast_created": {
      "author_fids": [3, 5],
      "mentioned_fids": [],
      "text": "optional regex",
      "embeds": "optional regex",
      "exclude_author_fids": []
    }
  }
}
```

The subscription must contain at least one event type. See [Subscription filters](./filters.md) for every available field and the size/regex constraints.

The `url` is SSRF-checked at create time. By default, loopback and RFC1918 addresses are rejected so you can't register `http://127.0.0.1` or internal-network targets unless your operator explicitly allows it.

**Response** (`WebhookResponse`):

```json
{
  "webhook": {
    "webhook_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_fid": 3,
    "target_url": "https://receiver.example.com/hook",
    "title": "my webhook",
    "description": "optional free-form",
    "active": true,
    "secrets": [
      {
        "uid": "...",
        "value": "<64-char hex signing secret>",
        "expires_at": null,
        "created_at": 1712345678
      }
    ],
    "subscription": { ... },
    "http_timeout": 10,
    "rate_limit": 1000,
    "rate_limit_duration": 60,
    "created_at": 1712345678,
    "updated_at": 1712345678
  }
}
```

**Save `secrets[0].value` now.** This is the HMAC signing secret you'll use to verify deliveries. You can list the webhook again later, but the secret value in subsequent responses is the same — rotating it via [secret rotation](#post-v2farcasterwebhooksecretrotate--rotate-secret) invalidates the old one on a grace window.

**Errors**

- `400` — invalid JSON, empty subscription, filter too large, invalid regex, SSRF-blocked URL.
- `401` — signature / clock / nonce / custody mismatch.
- `429` — per-FID cap reached.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/webhook/"
     data-title="Try webhook.create"
     data-op="webhook.create"
     data-body-template='{
  "name": "playground webhook",
  "url": "https://your-receiver.example.com/hook",
  "subscription": {
    "cast_created": { "author_fids": [3] }
  }
}'></div>

---

## GET /v2/farcaster/webhook/ — lookup

`X-Hypersnap-Op`: `webhook.read`

**Query**

| Name | Type | Required |
|---|---|---|
| `webhook_id` | UUID | yes |

**Response** — same `WebhookResponse` shape as create.

`403` if the webhook belongs to a different FID; `404` if not found.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/webhook/"
     data-title="Try webhook.read (lookup)"
     data-op="webhook.read"
     data-fields="webhook_id|query|uuid|webhook id||required"></div>

---

## GET /v2/farcaster/webhook/list — list

`X-Hypersnap-Op`: `webhook.read`

**Query** — none.

**Response**

```json
{ "webhooks": [ { /* webhook record */ } ] }
```

Returns up to the per-owner cap. Only webhooks owned by the signing FID are included.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/webhook/list"
     data-title="Try webhook.read (list)"
     data-op="webhook.read"></div>

---

## PUT /v2/farcaster/webhook/ — update

`X-Hypersnap-Op`: `webhook.update`

**Request body** (`UpdateWebhookRequest` — all fields except `webhook_id` are optional, only supplied fields change):

```json
{
  "webhook_id": "550e8400-e29b-41d4-a716-446655440000",
  "name":        "optional new name",
  "url":         "https://new-receiver.example.com/hook",
  "description": "optional new description",
  "subscription": { /* full replacement if supplied */ },
  "active":      true
}
```

If you set `active: false`, the webhook stays registered but Hypersnap stops dispatching events to it — useful for pausing a receiver for maintenance without losing the filter config.

**Response** — updated `WebhookResponse`. `403` if not owner.

<div class="try-it"
     data-method="PUT"
     data-path="/v2/farcaster/webhook/"
     data-title="Try webhook.update"
     data-op="webhook.update"
     data-body-template='{
  "webhook_id": "REPLACE-WITH-EXISTING-UUID",
  "active": true
}'></div>

---

## DELETE /v2/farcaster/webhook/ — delete

`X-Hypersnap-Op`: `webhook.delete`

**Query**

| Name | Type | Required |
|---|---|---|
| `webhook_id` | UUID | yes |

**Response**

```json
{ "deleted": true }
```

Soft-deletes the record. Retries queued for in-flight events stop dispatching. `403` if not owner.

<div class="try-it"
     data-method="DELETE"
     data-path="/v2/farcaster/webhook/"
     data-title="Try webhook.delete"
     data-op="webhook.delete"
     data-fields="webhook_id|query|uuid|webhook id||required"></div>

---

## POST /v2/farcaster/webhook/secret/rotate — rotate secret

`X-Hypersnap-Op`: `webhook.rotate_secret`

**Query**

| Name | Type | Required |
|---|---|---|
| `webhook_id` | UUID | yes |

**Response** — the full `WebhookResponse`. The `secrets` array now has one additional entry (the newest) and the previously-active secrets have `expires_at` set to `now + secret_grace_period_secs` (default 24h).

**How receivers should handle rotation**

1. Call `secret/rotate`.
2. Read the new secret from `secrets[-1].value` — this is what new deliveries will sign with.
3. Your receiver should accept *any* currently-valid secret when verifying. For the duration of the grace window, deliveries might be signed with either the old or the new key depending on timing. Maintain a set of accepted secrets and drop the old one when its `expires_at` passes.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/webhook/secret/rotate"
     data-title="Try webhook.rotate_secret"
     data-op="webhook.rotate_secret"
     data-fields="webhook_id|query|uuid|webhook id||required"></div>
