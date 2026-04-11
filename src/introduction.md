# Introduction

Hypersnap is a Rust implementation of a Farcaster node. Alongside the core consensus + gossip layer, it exposes an HTTP API at `/v2/farcaster/*` that mirrors the shape of the broader Farcaster v2 API ecosystem so existing client SDKs and patterns work unchanged.

## What's on the wire

There are **four** families of endpoint you care about as a developer:

1. **Public reads** (no auth). Casts, users, feeds, channels, reactions, follows, search. Shape matches common Farcaster v2 client contracts so serializers are interchangeable.
2. **Webhook management** (EIP-712 signed). Register a webhook owned by your FID, filter events, receive HMAC-signed deliveries.
3. **Mini-app management** (EIP-712 signed) + **send endpoint** (per-app bearer) + **client token webhook** (JFS-signed). The full Farcaster Mini App spec.
4. **Public batch reads** (no auth, POST body). Hydrate a list of FIDs with follows, reactions, signers, or registration metadata.

## What Hypersnap is not

- It is **not** a gRPC endpoint for message submission through this doc site. Message submission continues to use Farcaster's protobuf wire format over gRPC — see the upstream [Farcaster protocol spec](https://github.com/farcasterxyz/protocol) for that path.
- It is **not** an identity system. Hypersnap reads identity state from the on-chain `IdRegistry` contract. Your FID lives on L2, not in Hypersnap.
- It is **not** a walled garden. Every public read endpoint is unauthenticated and served from local RocksDB indexes over the data the node has ingested.

## Where Hypersnap lives

A Hypersnap node runs two listeners:

- **HTTP** (default `:3381`) — everything in this documentation.
- **gRPC** (default `:3383`) — internal consensus/gossip + protobuf message submission.

All URLs in this reference are relative to the HTTP listener. **A public Hypersnap node** — supporting every endpoint documented here — **is live at `https://haatz.quilibrium.com`**. Every example in this book uses that host so you can run the `curl` snippets verbatim and get real responses. Substitute your own hostname any time you're pointing at a self-hosted node.

## Versioning

- The HTTP API paths start with `/v2/farcaster/`. Hypersnap does not ship unstable endpoints in this prefix — if something is documented here, it's part of the stable contract.
- Subscription and event-schema changes to webhooks are additive: new event fields can appear, existing ones are not renamed or removed.
- Mini-app send and registration contracts track the upstream Farcaster Mini App spec at <https://miniapps.farcaster.xyz/docs/specification>.
