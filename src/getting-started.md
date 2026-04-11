# Your first request

The shortest path from zero to a real response: fetch a user by FID.

## 1. Pick a node

Hypersnap is self-hostable, but you don't have to run one yourself to follow along — **there is a public Hypersnap node you can point at right now:**

```text
https://haatz.quilibrium.com
```

Every example, every try-it panel, and the [interactive playground](./playground.md) all target this endpoint by default. Substitute your own hostname (e.g. `http://localhost:3381` for a local `hypersnap` process, or whatever operator URL you're working with) anywhere you see it.

## 2. Hit a public read

```bash
curl -s "https://haatz.quilibrium.com/v2/farcaster/user?fid=3" | jq .
```

Response:

```json
{
  "user": {
    "fid": 3,
    "username": "dwr.eth",
    "display_name": "Dan Romero",
    "pfp_url": "https://i.imgur.com/...",
    "profile": { "bio": { "text": "..." } },
    "follower_count": 12345,
    "following_count": 200,
    "verified_addresses": { "eth_addresses": ["0x..."] }
  }
}
```

No auth, no signed headers, no API key. Every endpoint under [Read API reference](./reference/reads/index.md) works this way.

## 3. Hit something paginated

Follower lists and feeds return a `next.cursor` you can pass back to walk the result set:

```bash
curl -s "https://haatz.quilibrium.com/v2/farcaster/user/followers?fid=3&limit=50" | jq '.next'
# { "cursor": "50" }

curl -s "https://haatz.quilibrium.com/v2/farcaster/user/followers?fid=3&limit=50&cursor=50" | jq '.users | length'
# 50
```

See [Pagination & cursors](./concepts/pagination.md) for the full contract.

## 4. What to read next

- **Want to fetch casts/users/feeds?** → [Read API reference](./reference/reads/index.md)
- **Want realtime events?** → [Webhooks](./reference/webhooks/index.md)
- **Building a mini app?** → [Mini-app notifications](./reference/miniapps/index.md)
- **Want an end-to-end walkthrough?** → [Build a Farcaster client](./guides/build-a-client.md)
- **Have an LLM write the code?** → [Using these docs with an LLM](./agents/index.md)
