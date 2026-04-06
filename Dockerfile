# ─── Single-stage Bun build ───────────────────────────────────
FROM oven/bun:1.3-slim

LABEL org.opencontainers.image.source="https://github.com/acdgbrasil/admin-painel"
LABEL org.opencontainers.image.description="ACDG Admin Panel — Elysia + Vanilla JS SPA"
LABEL org.opencontainers.image.licenses="UNLICENSED"

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src/ src/

# Build client bundle
RUN bun src/build.ts

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "src/server/index.ts"]
