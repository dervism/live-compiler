# syntax=docker/dockerfile:1
# Live Compiler — Haskell (haskell-language-server) language server. Build context: the project root.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM debian:bookworm-slim
ARG TARGETARCH
ARG GHC_VERSION=recommended
ARG HLS_VERSION=recommended
ARG CABAL_VERSION=recommended
ENV DEBIAN_FRONTEND=noninteractive LANG=C.UTF-8
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git xz-utils build-essential \
      libgmp-dev libffi-dev libncurses-dev zlib1g-dev libnuma-dev \
 && rm -rf /var/lib/apt/lists/*

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/haskell /opt/lsp-bridge/templates/haskell
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp
USER lsp
ENV PATH=/home/lsp/.ghcup/bin:$PATH
# GHC + haskell-language-server for the lsp user, via ghcup
RUN arch="$( [ "$TARGETARCH" = "arm64" ] && echo aarch64 || echo x86_64 )" \
 && mkdir -p /home/lsp/.ghcup/bin \
 && curl -fsSL "https://downloads.haskell.org/~ghcup/${arch}-linux-ghcup" -o /home/lsp/.ghcup/bin/ghcup \
 && chmod +x /home/lsp/.ghcup/bin/ghcup \
 && ghcup install ghc "${GHC_VERSION}" --set \
 && ghcup install cabal "${CABAL_VERSION}" --set \
 && ghcup install hls "${HLS_VERSION}" --set \
 && (ghcup gc --cache --tmpdirs || true)
ENV LSP_LANGS=haskell PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
