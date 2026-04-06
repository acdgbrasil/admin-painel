# CLAUDE.md — admin-painel

## Service

Admin panel for ACDG user management. Server-rendered HTML with HTMX interactivity, talking directly to the Zitadel Management API.

## Commands

```bash
bun run dev          # Run with --hot (hot reload)
bun run start        # Run production
bun run typecheck    # TypeScript strict check
```

## Stack

- **Runtime**: Bun
- **HTTP**: Elysia
- **Templating**: Tagged template literals (no JSX, no build step)
- **Interactivity**: HTMX (CDN)
- **Styling**: Tailwind CSS (CDN)
- **Auth**: OIDC Authorization Code flow, server-side (httpOnly cookie)
- **API**: Zitadel Management API (direct fetch + Bearer token)

## Architecture

```
src/
├── index.ts      — Elysia app, all routes
├── auth.ts       — OIDC server-side (login, callback, logout, cookie signing)
├── zitadel.ts    — Zitadel Management API client (fetch + Bearer token)
└── views/
    ├── layout.ts       — HTML base (head, nav, Tailwind CDN, HTMX CDN)
    ├── login.ts        — Login page
    ├── users.ts        — User list with search
    ├── user-detail.ts  — User detail + roles management
    └── user-new.ts     — Create user form
```

## Environment Variables

- `PORT` (default 3000)
- `HOST` (default 0.0.0.0)
- `OIDC_ISSUER` (default https://auth.acdgbrasil.com.br)
- `OIDC_CLIENT_ID` (default 367357876898889878)
- `OIDC_CLIENT_SECRET` — required for Authorization Code flow
- `SESSION_SECRET` — HMAC key for cookie signing (required in production)
- `BASE_URL` — public URL for redirect URIs (default http://localhost:3000)

## Conventions

- **No build step**: Bun runs TypeScript directly
- **No client-side JS framework**: HTMX handles interactivity
- **Server-side auth**: Tokens never reach the browser
- **HTML escaping**: All user content escaped via `esc()` helper
