# syntax=docker/dockerfile:1
# Live Compiler — Go (gopls) language server. Build context: the lsp/ folder.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM golang:1.23-bookworm
ARG GOPLS_VERSION=v0.17.1
RUN GOBIN=/usr/local/bin GOTOOLCHAIN=auto go install "golang.org/x/tools/gopls@${GOPLS_VERSION}" \
 && rm -rf /root/.cache /go/pkg

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/go /opt/lsp-bridge/templates/go
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp
USER lsp
ENV LSP_LANGS=go PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
