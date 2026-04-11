# Build an agent

An "agent" for the purposes of this guide is anything that reacts to Farcaster activity in realtime — a bot that replies to mentions, a moderator that watches a channel for abuse, an analytics pipeline that indexes a slice of the firehose, a notification service that tells Discord when someone mentions your DAO.

The core primitive is a **webhook subscription**.

## 1. Decide what you want to hear about

Write out what events your agent needs, as plain English:

> "I want to know about every cast that mentions FID 12345, and every reply to any cast authored by FID 12345."

Translate to a `WebhookSubscription`:

```json
{
  "cast_created": {
    "mentioned_fids": [12345],
    "parent_author_fids": [12345]
  }
}
```

**Gotcha:** fields inside a filter AND together. The filter above matches casts that both mention *and* reply to you. To OR the two conditions, register two webhooks, or register one very broad webhook and filter in your receiver.

See [Subscription filters](../reference/webhooks/filters.md) for every available field.

## 2. Stand up a receiver

Your receiver is a public HTTPS endpoint that accepts `POST` with a JSON body. Minimal Node.js example:

```javascript
import express from "express";
import crypto  from "crypto";

const app = express();

// Preserve raw bytes for HMAC verification.
app.use(express.raw({ type: "application/json", limit: "1mb" }));

const SECRET = process.env.WEBHOOK_SECRET;

app.post("/hook", (req, res) => {
  const received = req.header("x-hypersnap-signature");
  const expected = crypto
    .createHmac("sha512", SECRET)
    .update(req.body) // raw bytes
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"))) {
    return res.status(401).end();
  }

  const event = JSON.parse(req.body.toString("utf8"));
  // Durably enqueue before ACKing.
  void enqueue(event);
  res.status(200).end();
});

app.listen(8080);
```

The crucial pieces:

- **Raw bytes for HMAC.** Verify *before* `JSON.parse`. If you re-stringify the body, the hash won't match.
- **Enqueue, then ACK.** Put the event on your own durable queue, then return `200`. Don't hold the connection open for downstream work.
- **Return `5xx` on enqueue failure** so Hypersnap retries. Return `4xx` only if the message is malformed in a way that will never succeed.

See [Receive webhooks](./receive-webhooks.md) for the deep version of this.

## 3. Register the webhook

Sign an EIP-712 request as your FID's custody key:

```javascript
import { ethers } from "ethers";
import { randomBytes } from "crypto";

const wallet = new ethers.Wallet(process.env.CUSTODY_KEY);

const body = JSON.stringify({
  name: "my agent",
  url:  "https://receiver.example.com/hook",
  subscription: {
    cast_created: { mentioned_fids: [12345] },
  },
});

const signedAt = Math.floor(Date.now() / 1000);
const nonce    = "0x" + randomBytes(32).toString("hex");
const reqHash  = ethers.keccak256(ethers.toUtf8Bytes(body));

const sig = await wallet.signTypedData(
  { name: "Hypersnap", version: "1", chainId: 10 },
  { HypersnapSignedOp: [
      { name: "op",          type: "string"  },
      { name: "fid",         type: "uint64"  },
      { name: "signedAt",    type: "uint256" },
      { name: "nonce",       type: "bytes32" },
      { name: "requestHash", type: "bytes32" },
  ]},
  { op: "webhook.create", fid: 12345n, signedAt: BigInt(signedAt), nonce, requestHash: reqHash },
);

const resp = await fetch("https://haatz.quilibrium.com/v2/farcaster/webhook/", {
  method: "POST",
  headers: {
    "Content-Type":          "application/json",
    "X-Hypersnap-Fid":       "12345",
    "X-Hypersnap-Op":        "webhook.create",
    "X-Hypersnap-Signed-At": String(signedAt),
    "X-Hypersnap-Nonce":     nonce,
    "X-Hypersnap-Signature": sig,
  },
  body,
});

const { webhook } = await resp.json();
console.log("Save this signing secret:", webhook.secrets[0].value);
```

See [Sign an EIP-712 request](./sign-eip712.md) for Python and Rust.

## 4. Build your reaction logic

Inside your enqueue path, process the event. Events have a typed schema — see [Event schemas](../reference/webhooks/events.md).

```javascript
async function process(event) {
  if (event.type === "cast.created") {
    const cast = event.data.cast;
    if (cast.text.includes("@myagent")) {
      await reply(cast.hash, "hi, I'm a bot!");
    }
  }
}
```

## 5. Dedupe

Hypersnap delivers events **at-least-once**. Retries or network races can send the same logical event twice. Dedupe on the natural key:

| Event | Dedupe key |
|---|---|
| `cast.created` / `cast.deleted` | `data.cast.hash` |
| `follow.*` | `(follower.fid, target.fid)` |
| `reaction.*` | `(user.fid, cast.hash, reaction_type)` |

A cheap implementation: a Redis SET with a 1-hour TTL.

## 6. Rotate secrets

If your signing secret leaks, rotate:

```javascript
await fetch("https://haatz.quilibrium.com/v2/farcaster/webhook/secret/rotate?webhook_id=" + id, {
  method: "POST",
  headers: eip712Headers("webhook.rotate_secret", "" /* empty body */),
});
```

Response contains the new secrets array. During the grace window, deliveries might be signed with either the old or new key, so maintain a set of accepted secrets on your receiver and drop the old one when its `expires_at` passes.

## 7. When your agent needs to call reads too

Realtime events tell you *that* something happened. If you need context (who is this author? what's the parent of this cast? does this user follow me?), use the [Read API](../reference/reads/index.md) from the same process.

## Operational notes

- **Observability.** Log `(event.type, dedupe_key, attempt_count)` for every delivery. When things go wrong, you want to see whether an event was never delivered, delivered but failed locally, or delivered many times due to retries.
- **Backpressure.** If your processing is slow, 1000 events/minute (the default per-webhook rate limit) will still build up a backlog. Put a queue between the HTTP handler and your processor.
- **Cold starts.** When you first register a webhook, events start flowing within seconds. You do not get historical backfill — earlier events are not replayed. If you need history, do a one-time walk over the read API to seed state.
