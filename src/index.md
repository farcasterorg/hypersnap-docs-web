# Hypersnap API

Welcome to the developer reference for the **Hypersnap** Farcaster API.

Hypersnap is an open-source Farcaster node that speaks a v2 HTTP API compatible with the common Farcaster client ecosystem. Everything in this documentation targets developers building:

- **Farcaster clients** — feeds, user profiles, casts, reactions, search.
- **Agents & bots** — realtime event streams via outbound webhooks with filter subscriptions.
- **Mini apps** — registration, push notification delivery, and token management for the Farcaster Mini App spec.

> **Try it without running your own node.** A public Hypersnap node is live at `https://haatz.quilibrium.com`. Every example in this book targets it, and the [interactive playground](./playground.md) lets you hit every endpoint directly from this page — including wallet-signed management calls for webhooks and mini-app registration.

## What you'll find here

- **[Concepts](./concepts/index.md)** — the mental model: FIDs, messages, signed operations, JFS, pagination, errors.
- **[Read API reference](./reference/reads/index.md)** — every public GET/POST endpoint grouped by resource.
- **[Webhooks](./reference/webhooks/index.md)** — subscribing to realtime Farcaster events over HTTP.
- **[Mini-app notifications](./reference/miniapps/index.md)** — the full push-notification pipeline.
- **[Guides](./guides/build-a-client.md)** — end-to-end walkthroughs for building a client, an agent, or a mini app.
- **[For AI agents](./agents/index.md)** — how to hand these docs off to Claude, ChatGPT, or your own agent so it can write integration code for you.

## Quick orientation

| You want to… | Start here |
|---|---|
| Fetch a cast, user, or feed | [Read API reference](./reference/reads/index.md) |
| Subscribe to realtime events | [Webhooks overview](./reference/webhooks/index.md) |
| Send a push to mini app users | [Mini-app notifications](./reference/miniapps/index.md) |
| Sign a management request | [Signed operations (EIP-712)](./concepts/authentication.md) |
| Build a client from scratch | [Build a Farcaster client](./guides/build-a-client.md) |
| Have an LLM write the integration | [Using these docs with an LLM](./agents/index.md) |

## Search

Every page is indexed at build time. Press `s` (or tap the magnifier in the header) to search across the whole documentation set — the index ships with the page, so it works entirely offline without pinging any external service.
