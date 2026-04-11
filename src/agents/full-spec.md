# Full spec (single page)

This page is a placeholder for the build process. During `./build.sh`, the `scripts/generate-llms.sh` helper concatenates every page in the book (excluding this file and the SUMMARY) into `book/llms-full.txt`.

If you want the full single-file spec for an agent, fetch:

```
<docs-host>/llms-full.txt
```

or, if you're browsing locally after a build:

```
hypersnap-docs-web/book/llms-full.txt
```

There is also an index version (`<docs-host>/llms.txt`) for agents that prefer to fetch pages on-demand instead of consuming the whole spec up front.

## Why not render the full spec inline here?

mdBook renders one HTML page per source markdown file, and the search index assigns teaser snippets based on sub-sections within a page. A 10,000-line "everything" page would swallow every search result with the same title, making the search UX worse. The concatenated spec lives outside the rendered site, as a plain text file, for LLM consumption only.

## Pointing at the text files

Both `llms.txt` and `llms-full.txt` are static files emitted into `book/` alongside the HTML. Any static host (Cloudflare Pages, S3, nginx, GitHub Pages) will serve them without configuration.

For a local quick-check:

```bash
./build.sh
python3 -m http.server --directory book 8000 &
curl http://localhost:8000/llms.txt
curl http://localhost:8000/llms-full.txt | head
```
