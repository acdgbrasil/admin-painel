# ─── Build stage ──────────────────────────────────────────────
FROM oven/bun:1.3-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ─── Runtime stage ────────────────────────────────────────────
FROM oven/bun:1.3-slim AS runtime

LABEL org.opencontainers.image.source="https://github.com/acdgbrasil/admin-painel"
LABEL org.opencontainers.image.description="ACDG Admin Panel — SolidJS + Zitadel"
LABEL org.opencontainers.image.licenses="UNLICENSED"

WORKDIR /app

COPY --from=build /app/.output /app/.output
RUN cd .output/server && bun install --production && bun add srvx@0.9.8

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
