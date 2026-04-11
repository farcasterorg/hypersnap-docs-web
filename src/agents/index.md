# Using these docs with an LLM

This documentation is designed so that an AI coding agent — Claude, ChatGPT, Cursor, your own tool — can be handed the material in one shot and emerge able to write integration code for your project without guessing.

## The two files you care about

When you run `./build.sh` (or `mdbook build && ./scripts/generate-llms.sh`), the build produces, alongside the normal HTML site:

- **`book/llms.txt`** — a short, URL-annotated index in the format described at <https://llmstxt.org>. Point an agent at this file first. It will know what exists and how to fetch any individual page.
- **`book/llms-full.txt`** — every page in the docs concatenated into a single plain-text file. Drop this into an agent's context window directly. It is self-contained: one file, no external fetches required.

Both files are plain text. You can serve them from the same static host as the HTML site — they live at `<docs>/llms.txt` and `<docs>/llms-full.txt`.

## Typical flow

### When the docs are online

Give your agent the URL of `llms.txt`:

> Here is the full index of the Hypersnap API documentation: <https://hypersnap-docs.qstorage.quilibrium.com/llms.txt>
> Fetch whichever pages you need and use them to write the integration.

The agent fetches the index, picks the pages it needs, and pulls them over HTTP.

### When you want one-shot context

Copy-paste `llms-full.txt` into the agent's context:

> The full Hypersnap API docs are below. Using only this material, write me a Node.js agent that subscribes to `cast.created` events mentioning FID 12345 and posts them to a Slack channel.
>
> ```
> <contents of llms-full.txt>
> ```

Because the file is complete, the agent never has to ask "what does the `/v2/farcaster/webhook/` response look like?" — everything is in context.

### Inside Claude Code / Cursor

Point the agent at the repo root (or the `hypersnap-docs-web/src/` folder) and tell it to read the markdown directly. The source is organized by topic, so "read reference/webhooks first" works fine.

## What the agent should produce

A typical Hypersnap integration spans three shapes of code:

1. **Read calls** — unauthenticated GETs. Trivial; any HTTP client works.
2. **Signed management calls** — need EIP-712 signing with the caller's custody key. See the [Sign an EIP-712 request](../guides/sign-eip712.md) page; it has working JS, Python, and Rust snippets you can hand over verbatim.
3. **Webhook receivers** — a long-running HTTP endpoint that verifies HMAC-SHA512. See the [Receive webhooks](../guides/receive-webhooks.md) page.

If the agent asks "which one do I need?", the answer depends on direction:

- Reading data = (1).
- Sending events to users (mini-app push) or managing a subscription = (2).
- Receiving events from Hypersnap = (3).
- Agents/bots typically need (1) + (2) + (3).

## Per-agent pages

- **[Prompting Claude](./claude.md)** — a ready-to-paste system prompt plus context-window strategy.
- **[Prompting ChatGPT](./chatgpt.md)** — equivalent for GPT-family models.
- **[Integration checklist](./integration-checklist.md)** — a one-page list of everything an integration needs, suitable to hand to the agent as acceptance criteria.
- **[Full spec (single page)](./full-spec.md)** — the entire docs folded into one rendered page. Easier to copy-paste than walking the sidebar.

## A note on drift

These docs are versioned with the hypersnap source they describe. When in doubt about whether a field exists or an endpoint behaves a specific way, trust the source — point your agent at `src/api/` in the hypersnap repo. For production integrations, pin to a specific git commit of both the hypersnap source and this docs site, and re-verify before bumping.
