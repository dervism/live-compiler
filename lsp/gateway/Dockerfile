# Live Compiler — gateway (the only container with a published port)
FROM node:22-bookworm-slim
WORKDIR /opt/gateway
COPY gateway/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY gateway/gateway.js ./
COPY gateway/public/ ./public/
USER node
ENV PORT=7998
EXPOSE 7998
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:7998/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "/opt/gateway/gateway.js"]
