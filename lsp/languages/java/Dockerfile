# syntax=docker/dockerfile:1
# Live Compiler — Java (Eclipse JDT LS) language server. Build context: the project root.

# --- the shared bridge (Node + ws), copied into the image below ---
FROM node:22-bookworm-slim AS bridge
WORKDIR /opt/lsp-bridge
COPY bridge/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bridge/server.js ./

FROM eclipse-temurin:21-jdk
# jdtls is started by a Python launcher script
RUN apt-get update && apt-get install -y --no-install-recommends python3 curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /opt/jdtls \
 && curl -fsSL https://download.eclipse.org/jdtls/snapshots/jdt-language-server-latest.tar.gz | tar -C /opt/jdtls -xz \
 && ln -sf /opt/jdtls/bin/jdtls /usr/local/bin/jdtls

# --- bridge + templates, unprivileged user ---
COPY --from=bridge /usr/local/bin/node /usr/local/bin/node
COPY --from=bridge /opt/lsp-bridge /opt/lsp-bridge
COPY bridge/templates/java /opt/lsp-bridge/templates/java
RUN useradd --uid 10001 --create-home --shell /bin/bash lsp \
 && chown -R lsp:lsp /opt/jdtls   # jdtls writes to its configuration folder
USER lsp
ENV LSP_LANGS=java PORT=7999 SESSIONS_DIR=/tmp/lsp-sessions
EXPOSE 7999
CMD ["node", "/opt/lsp-bridge/server.js"]
