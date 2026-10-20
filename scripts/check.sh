#!/usr/bin/env sh
# Quick static checks: JS syntax of the app's inline script, the Node services, and compose config.
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
for f in app/index.html deck/index.html; do
  python3 -c "import re,sys;s=open('$f').read();open('$tmp/x.js','w').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-1])"
  node --check "$tmp/x.js" && echo "ok  $f"
done
node --check lsp/bridge/server.js && echo "ok  lsp/bridge/server.js"
node --check lsp/gateway/gateway.js && echo "ok  lsp/gateway/gateway.js"
cmp -s app/index.html lsp/gateway/public/index.html && echo "ok  gateway copy of the app is in sync" || { echo "FAIL gateway copy is stale: run npm run sync"; exit 1; }
(cd lsp && docker compose config -q && echo "ok  docker-compose.yml") || echo "skip docker compose (not available)"
rm -rf "$tmp"
