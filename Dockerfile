# ─── Build stage (Bun — fast install + build) ────────────────
FROM oven/bun:1.3-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ─── Runtime stage (Node.js — stable with node-server preset) ─
FROM node:22-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/acdgbrasil/admin-painel"
LABEL org.opencontainers.image.description="ACDG Admin Panel — SolidJS + Zitadel"
LABEL org.opencontainers.image.licenses="UNLICENSED"

WORKDIR /app

COPY --from=build /app/.output /app/.output

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
