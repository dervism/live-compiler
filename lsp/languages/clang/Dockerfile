# syntax=docker/dockerfile:1
# Live Compiler — C and C++ (clangd) language server. Build context: the project root.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM ubuntu:24.04
ARG CLANG_VERSION=18
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential "clangd-${CLANG_VERSION}" "clang-${CLANG_VERSION}" \
 && ln -sf "/usr/bin/clangd-${CLANG_VERSION}" /usr/local/bin/clangd \
 && rm -rf /var/lib/apt/lists/*

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/c /opt/lsp-bridge/templates/c
COPY bridge/templates/cpp /opt/lsp-bridge/templates/cpp
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp
USER lsp
ENV LSP_LANGS=c,cpp PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
