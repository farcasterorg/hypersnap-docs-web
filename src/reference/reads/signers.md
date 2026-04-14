# Signers

Signer endpoints expose on-chain `SignerEventBody` records from the `KeyRegistry` contract — the ed25519 keys a user has registered to sign Farcaster protocol messages.

All responses share the on-chain event shape:

```json
{
  "events": [
    {
      "object": "signer",
      "fid": 3,
      "event_type": "signer",
      "block_number": 12345678,
      "block_timestamp": 1712345678,
      "signer_key": "0x<ed25519-pubkey>",
      "key_type": 1,
      "metadata_type": 1
    }
  ],
  "next": { "cursor": null }
}
```

---

## GET /v2/farcaster/signer

Signers registered by `fid`. Also reachable as `GET /v2/farcaster/signers` (plural) and `GET /v2/farcaster/signer/list`.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/signer"
     data-title="Try /v2/farcaster/signer"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

---

## GET /v2/farcaster/onchain/signers

Identical to `/v2/farcaster/signer` — returns signer events for the given FID. Registered under the `/onchain/` namespace for spec compatibility.

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/onchain/signers"
     data-title="Try /v2/farcaster/onchain/signers"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

---

## GET /v2/farcaster/onchain/id_registry_event

`IdRegistry` events for `fid` — `Register`, `Transfer`, `ChangeRecovery`. Each event exposes `block_number`, `block_timestamp`, and `event_type`.

**Query parameters**

| Name | Type | Required |
|---|---|---|
| `fid` | u64 | yes |

<div class="try-it"
     data-method="GET"
     data-path="/v2/farcaster/onchain/id_registry_event"
     data-title="Try /v2/farcaster/onchain/id_registry_event"
     data-auth="none"
     data-fields="fid|query|u64||3|required"></div>

---

## Registered-for-compatibility endpoints

These endpoints exist for SDK compatibility but return empty responses. They depend on managed signer infrastructure that a self-hosted node does not operate:

| Path | Method |
|---|---|
| `/v2/farcaster/signer/signed_key` | GET |
| `/v2/farcaster/signer/developer_managed` | GET |
| `/v2/farcaster/signer/developer_managed/signed_key` | GET |

## Write endpoints

Signer creation and signed-key registration (`POST /v2/farcaster/signer`, `POST /v2/farcaster/signer/signed_key`, `POST /v2/farcaster/signer/developer_managed`, `POST /v2/farcaster/signer/developer_managed/signed_key`) return `501 Not Implemented`. Register signers directly against the on-chain `KeyRegistry` contract instead — the node will pick up the new signer on the next block.
