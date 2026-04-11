#!/usr/bin/env bash
#
# Build the Hypersnap API docs site.
#
# Produces:
#   book/            — rendered static HTML site (index.html + assets + compiled search index)
#   book/llms.txt    — llms.txt-format page index for LLM consumption
#   book/llms-full.txt — full concatenated spec as plain text
#
# Usage:
#   ./build.sh                           # build once
#   BASE_URL=https://hypersnap-docs.qstorage.quilibrium.com ./build.sh
#
# For live preview during editing:
#   mdbook serve --open

set -euo pipefail

cd "$(dirname "$0")"

if ! command -v mdbook >/dev/null 2>&1; then
  echo "error: mdbook not installed." >&2
  echo "install with: cargo install mdbook" >&2
  exit 1
fi

echo "building mdBook site..."
mdbook build

echo "generating llms.txt / llms-full.txt..."
./scripts/generate-llms.sh

echo
echo "done — output in ./book/"
echo "  ./book/index.html"
echo "  ./book/llms.txt"
echo "  ./book/llms-full.txt"
