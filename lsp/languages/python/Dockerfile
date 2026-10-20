# syntax=docker/dockerfile:1
# Live Compiler — Python (pyright) language server. Build context: the lsp/ folder.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM node:22-bookworm-slim
ARG PYRIGHT_VERSION=1.1.414
RUN apt-get update && apt-get install -y --no-install-recommends python3 \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g "pyright@${PYRIGHT_VERSION}" && npm cache clean --force

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/python /opt/lsp-bridge/templates/python
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp
USER lsp
ENV LSP_LANGS=python PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
