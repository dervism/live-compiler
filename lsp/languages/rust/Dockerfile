# syntax=docker/dockerfile:1
# Live Compiler — Rust (rust-analyzer) language server. Build context: the project root.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM rust:1-slim-bookworm
RUN rustup component add rust-analyzer rust-src \
 && rm -rf /usr/local/rustup/downloads /usr/local/rustup/tmp
# toolchains stay read-only in /usr/local; cargo's own cache goes in the user's home
ENV CARGO_HOME=/home/lsp/.cargo PATH=/usr/local/cargo/bin:$PATH

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/rust /opt/lsp-bridge/templates/rust
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp
USER lsp
ENV LSP_LANGS=rust PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
