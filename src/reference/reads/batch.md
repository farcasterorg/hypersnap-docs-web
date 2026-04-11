# Batch reads

POST-body hydration endpoints for when you need to enrich a list of FIDs with additional state in one call. All of these are unauthenticated and take the same basic request shape:

```json
{ "fids": [12345, 67890] }
```

Responses are objects keyed by stringified FID.

---

## POST /v2/farcaster/batch/following

For each FID in the request, return the list of FIDs they follow (truncated to a cap).

**Request**

```json
{ "fids": [3, 5] }
```

**Response**

```json
{
  "3": [
    { "fid": 5,   "followed_at": "2024-01-15T09:12:00Z" },
    { "fid": 191, "followed_at": "2024-02-02T13:40:00Z" }
  ],
  "5": [
    { "fid": 3, "followed_at": "2023-11-02T18:01:00Z" }
  ]
}
```

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/batch/following"
     data-title="Try /v2/farcaster/batch/following"
     data-auth="none"
     data-body-template='{ "fids": [3, 5] }'></div>

---

## POST /v2/farcaster/batch/reactions

For each FID, return their recent reactions (likes + recasts).

**Response**

```json
{
  "3": [
    { "target_fid": 5, "timestamp": 1712345678 }
  ]
}
```

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/batch/reactions"
     data-title="Try /v2/farcaster/batch/reactions"
     data-auth="none"
     data-body-template='{ "fids": [3, 5] }'></div>

---

## POST /v2/farcaster/batch/cast-interactions

For each FID, return a list of cast hashes and whether the FID liked, recasted, or replied to each.

**Response**

```json
{
  "3": [
    { "hash": "0xabc...", "liked": true, "recasted": false, "replied": true }
  ]
}
```

Useful for rendering "you liked this" state across a feed in one call instead of one lookup per cast.

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/batch/cast-interactions"
     data-title="Try /v2/farcaster/batch/cast-interactions"
     data-auth="none"
     data-body-template='{ "fids": [3, 5] }'></div>

---

## POST /v2/farcaster/batch/signers

For each FID, return its registered signer set from the on-chain `KeyRegistry`.

**Response**

```json
{
  "3": [
    {
      "signer":    "0x<ed25519-pubkey>",
      "created_at": 1712345678,
      "key_type":   1,
      "metadata_type": 1
    }
  ]
}
```

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/batch/signers"
     data-title="Try /v2/farcaster/batch/signers"
     data-auth="none"
     data-body-template='{ "fids": [3, 5] }'></div>

---

## POST /v2/farcaster/batch/id-registrations

For each FID, return its `IdRegistry` history — registration, transfers, and the current owner.

**Response**

```json
{
  "3": [
    {
      "from":      "0x0000...0000",
      "to":        "0xabcd...abcd",
      "timestamp": 1700000000,
      "event_type": "register"
    }
  ]
}
```

<div class="try-it"
     data-method="POST"
     data-path="/v2/farcaster/batch/id-registrations"
     data-title="Try /v2/farcaster/batch/id-registrations"
     data-auth="none"
     data-body-template='{ "fids": [3, 5] }'></div>
