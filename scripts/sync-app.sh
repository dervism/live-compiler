#!/usr/bin/env sh
# The gateway serves a copy of the app. Run this after editing app/index.html.
set -e
cd "$(dirname "$0")/.."
cp app/index.html lsp/gateway/public/index.html
echo "copied app/index.html -> lsp/gateway/public/index.html"
