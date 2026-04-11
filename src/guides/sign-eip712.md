# Sign an EIP-712 request

This page has working examples in JavaScript, Python, and Rust for producing the EIP-712 signature + headers that Hypersnap's management endpoints require. See [Signed operations](../concepts/authentication.md) for the full spec and [Errors](../concepts/errors.md) if your signed request gets rejected.

All three examples sign the same operation — `webhook.create` — against the same body. Adapt by changing the op string and body.

## Shared contract

```
Domain: { name: "Hypersnap", version: "1", chainId: 10 }
Type:   HypersnapSignedOp(
          string  op,
          uint64  fid,
          uint256 signedAt,
          bytes32 nonce,
          bytes32 requestHash,  // keccak256(raw body bytes)
        )
```

Headers on the resulting request:

- `X-Hypersnap-Fid:       <fid>`
- `X-Hypersnap-Op:        <op>`
- `X-Hypersnap-Signed-At: <unix seconds>`
- `X-Hypersnap-Nonce:     0x<32 bytes hex>`
- `X-Hypersnap-Signature: 0x<65 bytes hex>`

## JavaScript (ethers v6)

```javascript
import { ethers } from "ethers";
import { randomBytes } from "crypto";

const wallet = new ethers.Wallet(process.env.CUSTODY_PRIVATE_KEY);
const FID = 12345n;

const body = JSON.stringify({
  name: "my webhook",
  url:  "https://receiver.example.com/hook",
  subscription: { cast_created: { author_fids: [3] } },
});

const signedAt = Math.floor(Date.now() / 1000);
const nonce    = "0x" + Buffer.from(randomBytes(32)).toString("hex");
const reqHash  = ethers.keccak256(ethers.toUtf8Bytes(body));

const domain = { name: "Hypersnap", version: "1", chainId: 10 };
const types  = {
  HypersnapSignedOp: [
    { name: "op",          type: "string"  },
    { name: "fid",         type: "uint64"  },
    { name: "signedAt",    type: "uint256" },
    { name: "nonce",       type: "bytes32" },
    { name: "requestHash", type: "bytes32" },
  ],
};
const value = {
  op: "webhook.create",
  fid: FID,
  signedAt: BigInt(signedAt),
  nonce,
  requestHash: reqHash,
};

const signature = await wallet.signTypedData(domain, types, value);

const resp = await fetch("https://haatz.quilibrium.com/v2/farcaster/webhook/", {
  method: "POST",
  headers: {
    "Content-Type":          "application/json",
    "X-Hypersnap-Fid":       String(FID),
    "X-Hypersnap-Op":        "webhook.create",
    "X-Hypersnap-Signed-At": String(signedAt),
    "X-Hypersnap-Nonce":     nonce,
    "X-Hypersnap-Signature": signature,
  },
  body,
});
console.log(resp.status, await resp.json());
```

## Python (eth_account)

```python
import json, os, time
from secrets import token_bytes
from eth_account import Account
from eth_account.messages import encode_typed_data
from eth_utils import keccak
import requests

CUSTODY_PRIVATE_KEY = os.environ["CUSTODY_PRIVATE_KEY"]
FID = 12345

body = json.dumps({
    "name": "my webhook",
    "url":  "https://receiver.example.com/hook",
    "subscription": {"cast_created": {"author_fids": [3]}},
}, separators=(",", ":"))

signed_at = int(time.time())
nonce_bytes = token_bytes(32)
nonce_hex   = "0x" + nonce_bytes.hex()
req_hash    = keccak(body.encode())

typed_data = {
    "domain": {"name": "Hypersnap", "version": "1", "chainId": 10},
    "primaryType": "HypersnapSignedOp",
    "types": {
        "EIP712Domain": [
            {"name": "name",    "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
        ],
        "HypersnapSignedOp": [
            {"name": "op",          "type": "string"},
            {"name": "fid",         "type": "uint64"},
            {"name": "signedAt",    "type": "uint256"},
            {"name": "nonce",       "type": "bytes32"},
            {"name": "requestHash", "type": "bytes32"},
        ],
    },
    "message": {
        "op":          "webhook.create",
        "fid":         FID,
        "signedAt":    signed_at,
        "nonce":       nonce_bytes,
        "requestHash": req_hash,
    },
}

encoded = encode_typed_data(full_message=typed_data)
signed  = Account.from_key(CUSTODY_PRIVATE_KEY).sign_message(encoded)

resp = requests.post(
    "https://haatz.quilibrium.com/v2/farcaster/webhook/",
    data=body,
    headers={
        "Content-Type":          "application/json",
        "X-Hypersnap-Fid":       str(FID),
        "X-Hypersnap-Op":        "webhook.create",
        "X-Hypersnap-Signed-At": str(signed_at),
        "X-Hypersnap-Nonce":     nonce_hex,
        "X-Hypersnap-Signature": signed.signature.hex(),
    },
)
print(resp.status_code, resp.json())
```

**Gotcha:** `json.dumps(..., separators=(",", ":"))` gives you deterministic bytes with no spaces. If you pass a pre-built dict straight to `requests.post(json=...)`, `requests` re-serializes it and the hash you signed may not match what's on the wire. Always serialize to a `str`/`bytes` value once and use the same bytes for both the hash and the request body.

## Rust (alloy)

```rust,ignore
use alloy_dyn_abi::TypedData;
use alloy_primitives::{keccak256, B256, U256};
use alloy_signer::{Signer, SignerSync};
use alloy_signer_local::PrivateKeySigner;
use rand::{rngs::OsRng, RngCore};
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let signer: PrivateKeySigner = std::env::var("CUSTODY_PRIVATE_KEY")?.parse()?;
    let fid: u64 = 12345;

    let body = serde_json::to_vec(&json!({
        "name": "my webhook",
        "url":  "https://receiver.example.com/hook",
        "subscription": { "cast_created": { "author_fids": [3] } }
    }))?;

    let signed_at = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
    let mut nonce_bytes = [0u8; 32];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = B256::from(nonce_bytes);
    let req_hash = keccak256(&body);

    // Build the typed-data JSON; alloy_dyn_abi::TypedData accepts this shape.
    let typed = json!({
        "domain": { "name": "Hypersnap", "version": "1", "chainId": 10 },
        "primaryType": "HypersnapSignedOp",
        "types": {
            "EIP712Domain": [
                { "name": "name",    "type": "string" },
                { "name": "version", "type": "string" },
                { "name": "chainId", "type": "uint256" }
            ],
            "HypersnapSignedOp": [
                { "name": "op",          "type": "string"  },
                { "name": "fid",         "type": "uint64"  },
                { "name": "signedAt",    "type": "uint256" },
                { "name": "nonce",       "type": "bytes32" },
                { "name": "requestHash", "type": "bytes32" }
            ]
        },
        "message": {
            "op":          "webhook.create",
            "fid":         fid,
            "signedAt":    U256::from(signed_at),
            "nonce":       format!("{nonce:#x}"),
            "requestHash": format!("{:#x}", req_hash)
        }
    });
    let td: TypedData = serde_json::from_value(typed)?;
    let hash = td.eip712_signing_hash()?;
    let sig  = signer.sign_hash_sync(&hash)?;

    let resp = reqwest::Client::new()
        .post("https://haatz.quilibrium.com/v2/farcaster/webhook/")
        .header("Content-Type", "application/json")
        .header("X-Hypersnap-Fid", fid.to_string())
        .header("X-Hypersnap-Op", "webhook.create")
        .header("X-Hypersnap-Signed-At", signed_at.to_string())
        .header("X-Hypersnap-Nonce", format!("{nonce:#x}"))
        .header("X-Hypersnap-Signature", format!("0x{}", hex::encode(sig.as_bytes())))
        .body(body)
        .send()
        .await?;

    println!("{} {}", resp.status(), resp.text().await?);
    Ok(())
}
```

## Adapting to other operations

Change two things:

1. The `op` string in both the header and the signed typed data message.
2. The body. For `DELETE` / `GET` / `POST .../secret/rotate` which have no body, use an empty byte string (`""`) — the `requestHash` becomes `keccak256("")` which is `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`.

The op ↔ method/path mapping is in [Signed operations](../concepts/authentication.md#operation-names).
