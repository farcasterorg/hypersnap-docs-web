#!/usr/bin/env bash
#
# Generate llms.txt and llms-full.txt for LLM / agent consumption.
#
# - llms.txt      — a short index in the format described at https://llmstxt.org,
#                   listing every page in this docs site with its URL and a
#                   one-line hook.
# - llms-full.txt — every page in the book concatenated into one plain-text
#                   file, separated by section markers. Suitable for pasting
#                   directly into an LLM's context window.
#
# Both files are written into the build directory (default: `book/`), next to
# the HTML output, so static hosting serves them without extra config.
#
# Usage:
#   ./scripts/generate-llms.sh                    # uses ./book/
#   BUILD_DIR=out ./scripts/generate-llms.sh
#   BASE_URL=https://hypersnap-docs.qstorage.quilibrium.com ./scripts/generate-llms.sh

set -euo pipefail

BUILD_DIR="${BUILD_DIR:-book}"
SRC_DIR="${SRC_DIR:-src}"
BASE_URL="${BASE_URL:-}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "error: source directory '$SRC_DIR' not found (run from repo root)" >&2
  exit 1
fi

mkdir -p "$BUILD_DIR"

INDEX="$BUILD_DIR/llms.txt"
FULL="$BUILD_DIR/llms-full.txt"

# ---------- llms.txt (index) ----------
{
  echo "# Hypersnap API Documentation"
  echo
  echo "> Developer reference for the Hypersnap Farcaster API. Build Farcaster clients, agents, and mini apps against a hypersnap node."
  echo
  echo "This index follows the llms.txt convention (https://llmstxt.org). Fetch any of the URLs below to read the full page as rendered markdown."
  echo
} > "$INDEX"

# Walk SUMMARY.md and emit one link per page, preserving section structure.
python3 - "$SRC_DIR/SUMMARY.md" "$BASE_URL" >> "$INDEX" <<'PY'
import re, sys, pathlib

summary_path = pathlib.Path(sys.argv[1])
base_url     = sys.argv[2].rstrip("/")
src_dir      = summary_path.parent

text = summary_path.read_text()

section_re = re.compile(r"^# (.+)$")
link_re    = re.compile(r"-\s*\[([^\]]+)\]\(([^)]+)\)")
title_re   = re.compile(r"^\[([^\]]+)\]\(([^)]+)\)")

for line in text.splitlines():
    m = section_re.match(line)
    if m:
        print()
        print(f"## {m.group(1).strip()}")
        print()
        continue
    m = link_re.search(line)
    if not m:
        m = title_re.search(line)
    if not m:
        continue
    title, rel = m.group(1), m.group(2)
    if rel.startswith("./"):
        rel = rel[2:]
    # Resolve + read the first non-empty line after the first H1 as a hook.
    src_path = src_dir / rel
    hook = ""
    if src_path.exists():
        for raw in src_path.read_text().splitlines():
            s = raw.strip()
            if not s or s.startswith("#"):
                continue
            hook = s
            break
    url_path = rel.replace(".md", ".html")
    url = f"{base_url}/{url_path}" if base_url else url_path
    if hook:
        # Trim hook so the index line stays readable.
        if len(hook) > 140:
            hook = hook[:137] + "..."
        print(f"- [{title}]({url}) — {hook}")
    else:
        print(f"- [{title}]({url})")
PY

# ---------- llms-full.txt (concatenated) ----------
{
  echo "# Hypersnap API — Full Documentation"
  echo
  echo "This file concatenates every page of the Hypersnap API docs into a"
  echo "single plain-text document for LLM / agent consumption. Paste the"
  echo "whole thing into a context window; it is self-contained."
  echo
  echo "Source: $SRC_DIR/"
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  echo "---"
  echo
} > "$FULL"

# Walk SUMMARY.md in order and append each page body with a header banner.
python3 - "$SRC_DIR/SUMMARY.md" "$FULL" <<'PY'
import re, sys, pathlib

summary_path = pathlib.Path(sys.argv[1])
full_path    = pathlib.Path(sys.argv[2])
src_dir      = summary_path.parent

text = summary_path.read_text()
link_re  = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
# Skip the "full spec" placeholder + any self-reference.
skip_names = { "full-spec.md" }

seen = set()
with full_path.open("a") as out:
    for line in text.splitlines():
        m = link_re.search(line)
        if not m:
            continue
        _, rel = m.group(1), m.group(2)
        if rel.startswith("./"):
            rel = rel[2:]
        if rel in seen or pathlib.PurePath(rel).name in skip_names:
            continue
        seen.add(rel)
        path = src_dir / rel
        if not path.exists():
            continue
        out.write(f"\n\n========================================\n")
        out.write(f"# PAGE: {rel}\n")
        out.write(f"========================================\n\n")
        out.write(path.read_text())
        out.write("\n")
PY

echo "wrote $INDEX"
echo "wrote $FULL"
