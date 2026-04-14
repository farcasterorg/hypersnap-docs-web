# Prompting ChatGPT

GPT-4o / GPT-4.1 / GPT-5-series all handle Hypersnap integrations well. The patterns are the same as for [Claude](./claude.md) — the differences below are small, but worth knowing.

## System prompt

```text
You are writing code against the Hypersnap Farcaster API. The full
documentation for Hypersnap is attached / pasted below.

Strict rules:
1. Only use endpoints, headers, fields, and behaviors explicitly listed
   in the documentation. If you are unsure whether something exists,
   say so and stop — do not guess.
2. Signed management requests must produce all five X-Hypersnap-*
   headers exactly as specified, and must hash the literal request body
   bytes using keccak256.
3. Webhook receivers must verify HMAC-SHA512 over the raw request body
   before parsing JSON, use a timing-safe comparison, and support multiple
   valid secrets for rotation windows.
4. When in doubt, produce working code for the simplest case and flag
   what you chose not to implement.
5. Do not fabricate client SDK package names. Use the HTTP client that
   ships with the target language unless I ask otherwise.

Target language: <fill in>.
Target framework (if any): <fill in>.
```

## How to provide the docs

### Option A — attach `llms-full.txt` as a file

In ChatGPT's web UI, drag-and-drop the file into the conversation. In the API, use a file upload + the file search tool. GPT will chunk-read it as needed.

This is the preferred option: ChatGPT's file-handling path is more efficient than pasting the full text inline when the file is large.

### Option B — paste inline

Works for smaller excerpts. If your integration only touches one section (e.g. just the webhooks pages), paste those specific pages into the prompt rather than the whole `llms-full.txt`.

### Option C — ChatGPT with tools / browsing

Provide the `llms.txt` URL. ChatGPT's browsing path is slower and less reliable than Claude's file-reading for this kind of content, but it works.

## ChatGPT-specific gotchas

- **Schema hallucination.** GPT is more prone than Claude to inventing field names from other Farcaster-compatible APIs (e.g. `object_type`, `viewer_context`). Use a strict prompt ("only use fields present in the documentation") and skim the output for familiar-but-wrong field names before running it.
- **EIP-712 type naming.** GPT sometimes emits `verifyingContract` in the domain even though Hypersnap's domain only has `name`/`version`/`chainId`. Spell out the exact domain in your prompt.
- **"Here's a helpful wrapper I just imagined."** GPT likes to propose fictitious npm packages (e.g. `@hypersnap/client`). Instruct it to use only the standard library or well-known HTTP clients (axios, requests, reqwest).

## Example prompt

```text
You are writing code against the Hypersnap Farcaster API. The full
documentation is attached as llms-full.txt.

Rules:
- Only use endpoints, headers, fields, and behaviors from the docs.
- No fictitious SDK packages — use node's built-in `fetch` and `crypto`.
- EIP-712 signing: use `ethers@6`.

Task:
Write a Node.js script `rotate-secret.js` that, given env vars
CUSTODY_PRIVATE_KEY, FID, and WEBHOOK_ID, calls the webhook
secret-rotation endpoint and prints the new secret value. Include
error handling for 401 and 404.
```

## Validating output

Ask a follow-up:

> Print the exact bytes of the request body you'll be hashing, and the exact value of each X-Hypersnap-* header. Do not run the code; just show me the values.

If the body bytes don't match what the `fetch` call sends (e.g. `JSON.stringify(body)` vs a pre-serialized string variable), the signature will fail. Catching this statically saves a debugging loop.
