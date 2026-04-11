# hypersnap-docs-web

Developer documentation for the [Hypersnap](https://github.com/farcasterorg/hypersnap) Farcaster API, built as a static mdBook site with compile-time search and LLM-friendly plain-text exports.

## What's inside

- **`src/`** — plain markdown source, organized by topic (`concepts/`, `reference/`, `guides/`, `agents/`, `appendix/`).
- **`book.toml`** — mdBook configuration. Compile-time search is enabled — the index ships with the site, no external service required.
- **`theme/custom.css`** — minor visual polish on top of the default mdBook navy theme.
- **`scripts/generate-llms.sh`** — post-build step that emits `llms.txt` (page index) and `llms-full.txt` (concatenated spec) for agent / LLM consumption.
- **`build.sh`** — one-shot build: `mdbook build` + llms.txt generation.
- **`book/`** — build output (gitignored).

## Prerequisites

```bash
cargo install mdbook
```

No Node.js, no external services, no npm. mdBook is a single Rust binary.

## Build

```bash
./build.sh
```

Produces:

- `book/index.html` — landing page of the rendered site.
- `book/*.html`, `book/**/*.html` — every page.
- `book/searchindex.js` — mdBook's compile-time elasticlunr search index (~50-200 KB depending on content).
- `book/llms.txt` — URL index in the [llms.txt](https://llmstxt.org) format.
- `book/llms-full.txt` — every page concatenated to one plain-text file.

Drop `book/` onto any static host (Cloudflare Pages, S3, nginx, GitHub Pages, Netlify). No runtime required.

## Live preview

```bash
mdbook serve --open
```

Opens a local server on `http://localhost:3000` and reloads on markdown changes. Search is active in this mode.

## Customizing the base URL

If you're serving the docs from a non-root path or using a custom domain, set `BASE_URL` when building so the `llms.txt` index emits absolute URLs:

```bash
BASE_URL=https://hypersnap-docs.qstorage.quilibrium.com ./build.sh
```

Without `BASE_URL`, the index emits relative paths that still work when the file is served alongside the HTML.

## Editing

Every page lives in `src/` as a plain `.md` file. The table of contents is in `src/SUMMARY.md`; adding a page is a two-step process:

1. Create the new `.md` file under `src/`.
2. Add a bullet in `SUMMARY.md` pointing at it.

mdBook rebuilds the site and the search index on the next `mdbook build`.

## For AI agents

This docs site is designed to be handed to a coding agent:

- Point Claude / ChatGPT / Cursor at **`book/llms.txt`** and it has the full page index.
- Paste **`book/llms-full.txt`** into an agent's context window and it has the whole spec in-band.
- The [For AI agents](src/agents/index.md) section has per-model prompting guidance.

## License

Same license as the hypersnap source it documents — see upstream.
