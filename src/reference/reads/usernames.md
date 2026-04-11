# Usernames & proofs

Farcaster usernames are backed by off-chain "fnames" and on-chain ENS/Basenames. These endpoints let you check availability and look up the proof record attached to a name.

---

## GET /v2/farcaster/fname/availability

Is an fname available to register?

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fname` | string | yes |

**Response**

```json
{
  "available": true,
  "username": null
}
```

If the name is taken, `available` is `false` and `username` contains the normalized name string.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/fname/availability"
     data-title="Try /v2/farcaster/fname/availability"
     data-auth="none"
     data-fields="fname|query|string|candidate name||required"></div>

---

## GET /v2/farcaster/username-proof

Fetch the raw username proof record for a given name. Useful when you want to verify on-chain provenance yourself instead of trusting the resolved `User.username` field.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `username` | string | yes |

**Response**

```json
{
  "username_proof": {
    "timestamp": 1712345678,
    "name": "alice",
    "owner": "0x...",
    "signature": "0x...",
    "fid": 12345,
    "type": "USERNAME_TYPE_FNAME"
  }
}
```

If the name has no proof, `username_proof` is `null`.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/username-proof"
     data-title="Try /v2/farcaster/username-proof"
     data-auth="none"
     data-fields="username|query|string||dwr.eth|required"></div>
