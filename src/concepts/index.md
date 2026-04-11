# Concepts

Before diving into endpoints, it helps to have the mental model that the rest of this documentation assumes.

- **[Farcaster identity (FIDs)](./fids.md)** — what an FID is, how custody works, how Hypersnap resolves it.
- **[Signed operations (EIP-712)](./authentication.md)** — how management requests (webhooks, mini-app registration) are authenticated using the FID's custody key.
- **[JSON Farcaster Signatures (JFS)](./jfs.md)** — the Ed25519 envelope Farcaster clients use to report mini-app token events.
- **[Pagination & cursors](./pagination.md)** — the `next.cursor` contract used across list endpoints.
- **[Rate limits](./rate-limits.md)** — what the server enforces and what it doesn't.
- **[Errors](./errors.md)** — HTTP status codes and response shapes you should expect.

None of these are long reads — you can skim them in a few minutes and come back as a reference when something in the endpoint pages doesn't make sense.
