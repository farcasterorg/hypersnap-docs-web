# Farcaster identity (FIDs)

Every Farcaster user has a **Farcaster ID (FID)** — a `u64` assigned by the on-chain `IdRegistry` contract. An FID is permanent and non-transferable, but the **custody address** that controls it can change via the `IdGateway` contract.

## The three moving parts

1. **FID** — `u64`. Stable. Public. This is what appears in every API response.
2. **Custody address** — the Ethereum address currently in charge of the FID. Signing a Hypersnap management request (creating a webhook, registering a mini app) means producing an EIP-712 signature with this key.
3. **Signers** — Ed25519 keys registered to an FID via the `KeyRegistry` contract. These sign Farcaster *messages* (casts, reactions, follows). Mini-app token webhooks (JFS) are validated against the active signer set for an FID.

Hypersnap reads (1)–(3) from on-chain state, indexed locally. The custody lookup is available everywhere EIP-712 verification happens; the signer lookup is used when verifying JFS token webhooks.

## How Hypersnap derives custody

When you sign a webhook-management request, Hypersnap:

1. Recovers the signer address from your EIP-712 signature.
2. Calls its `CustodyAddressLookup::get_custody_address(fid)`, which reads local `IdRegistry` event state.
3. Rejects the request if the recovered address doesn't match.

If your custody address changes on-chain, the next request signed with the new key just works — Hypersnap follows the on-chain state, it does not maintain a separate registration step.

## Usernames vs FIDs

The API accepts both where it makes sense:

- `GET /v2/farcaster/user?fid=3` — look up by FID.
- `GET /v2/farcaster/user/by-username?username=dwr.eth` — look up by username.

Usernames are either:

- **fnames** — off-chain usernames managed by the Farcaster name service.
- **ENS names** — verified on-chain.
- **Basenames** — the `.base.eth` space.

All three resolve through the same `username_proof` table and surface on the `User` object in your responses. When you display a user, prefer `display_name` → `username` → `fid` as fallbacks.

## Why the API has no logins

There are no session tokens, no API keys for reads, no OAuth dance. Public reads are genuinely public: Hypersnap serves them from local indexes, and the authoritative data is already public on-chain (signers, registrations) and in the Farcaster node network (messages). Anything that mutates state (webhooks, mini app registrations) is authenticated directly by the FID's custody key via EIP-712 — see [Signed operations](./authentication.md) for the details.
