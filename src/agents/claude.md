# Prompting Claude

Claude is well-suited to Hypersnap integrations because the API surface is small, the auth model is well-documented, and the long-form nature of these docs fits Claude's context window comfortably (`llms-full.txt` is a few thousand lines).

## System prompt to start from

```text
You are helping me build an integration against the Hypersnap Farcaster API.

Complete Hypersnap API documentation is provided below in plain text.

Rules:
1. Only use endpoints, headers, fields, and behaviors that are explicitly
   described in the documentation. Do not invent endpoints or fields.
2. When the documentation says a field is required, treat it as required.
   When it says optional, you may omit it. When it gives a default, don't
   re-specify it unless I ask.
3. If the documentation contradicts your prior training about
   "Farcaster-compatible APIs" (Neynar, etc.), the documentation wins.
4. For signed management requests, always:
   - Include all five X-Hypersnap-* headers.
   - Hash the literal request body bytes (do not re-serialize JSON).
   - Use a fresh nonce per request.
   - Cross-check the op string against the HTTP method+path.
5. For webhook receivers, always:
   - Verify the HMAC-SHA512 signature using the raw request body bytes
     before JSON-parsing.
   - Use constant-time comparison.
   - Accept multiple valid secrets during rotation grace windows.
   - Dedupe on the event's natural key.
   - Return 2xx only after durably enqueuing the event.
6. Write idiomatic code for the target language/framework. Prefer standard
   library where possible. Avoid heavy wrapper SDKs unless I ask.

When writing code, flag any assumption that isn't explicit in the docs.
```

## How to provide the docs

### Option A — paste `llms-full.txt` into the conversation

Copy the full file. The context window in Claude Sonnet/Opus 4.x is large enough to hold it alongside your question and Claude's response. This is the most reliable option — zero tool-use, everything Claude needs is in-band.

### Option B — Claude with web access

Provide the URL of `llms.txt` and let Claude fetch pages via its web/file tools:

> The Hypersnap docs index is at https://hypersnap-docs.qstorage.quilibrium.com/llms.txt — fetch the pages you need.

Works well in Claude Code (where Claude already has fetch tools). Less reliable in plain Claude.ai unless the docs are on a host Claude can read.

### Option C — Claude Code with the repo checked out

Most efficient for ongoing work. Check the docs repo out alongside the hypersnap repo:

```
/code
├── hypersnap/
└── hypersnap-docs-web/
    └── src/
```

Then invoke Claude Code from `/code/hypersnap-docs-web/` or `/code/hypersnap/` and say:

> Read the markdown in ../hypersnap-docs-web/src/ first, then help me write an integration that does X.

Claude Code will open the relevant files on demand. The directory layout is semantic (`concepts/`, `reference/webhooks/`, etc.) so "read reference/webhooks and reference/miniapps" is a perfectly clear instruction.

## Example prompts

### Build an agent that watches for mentions

> Using only the Hypersnap docs, write a Node.js service that:
> 1. Registers a webhook subscribed to `cast_created` events mentioning FID 12345.
> 2. Verifies deliveries via HMAC-SHA512.
> 3. For each matching cast, posts a summary to Slack via an incoming webhook.
>
> Use ethers v6 for EIP-712 signing. Include a rotation-safe secret set.

### Build a mini-app send backend

> I have a registered mini app with `app_id=3Hq9ZgK2p4vNfWxR`. Using only the Hypersnap docs, write a Python Flask endpoint that accepts `POST /internal/notify` with JSON `{ fid, title, body }` and forwards it to the Hypersnap send endpoint. Use the spec's recommended dedupe UUID per notification.

### Build a read client

> Using only the Hypersnap docs, write a TypeScript function `getThread(hash: string)` that returns the cast plus the first three levels of replies. Use `fetch`, no SDK. Handle 404.

## Tips

- **Name the op string explicitly in your prompt.** Claude's training data includes Neynar-style APIs where op strings look different. Spelling it out ("use `webhook.create`") avoids a small but real hallucination risk.
- **Constrain to "only use fields in the docs".** This pre-empts field inventions.
- **Ask for a test in the same prompt.** Claude is happy to write a unit test for signature verification alongside the main code; you want that test.
- **Review the signed bytes.** For EIP-712 code specifically, have Claude print the body bytes it hashed and verify they match what actually gets sent over the wire. Body hash mismatches are the #1 failure mode on first run.
