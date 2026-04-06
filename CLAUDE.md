# CLAUDE.md — admin-painel

## Service

Admin panel for ACDG user management. Reactive SPA with vanilla JS + server-side auth, talking to Zitadel Management API and People Context API.

## Commands

```bash
bun run dev          # Build client + run server with hot reload
bun run build:client # Bundle client JS (→ public/app.js)
bun run start        # Build + run production
bun run typecheck    # TypeScript strict check (bunx tsc)
```

## Stack

- **Runtime**: Bun (server + build)
- **Server**: Elysia (auth + JSON API)
- **Client**: Vanilla JS SPA (zero framework, reactive signals)
- **Styling**: Tailwind CSS (CDN)
- **Auth**: OIDC Authorization Code flow, server-side (httpOnly cookie)
- **Build**: `Bun.build` → `public/app.js` (browser target)

## Architecture — Clean Architecture + MVVM (Functional)

```
src/
├── data/                            — DataLayer (Ports & Adapters)
│   ├── model/                       — Domain types (shared server+client)
│   │   ├── result.ts                — ApiResult<T> discriminated union
│   │   ├── session.ts               — Session, SessionInfo
│   │   ├── user.ts                  — User, UserState, StateBadge
│   │   ├── grant.ts                 — UserGrant, Project, ProjectRole
│   │   └── person.ts               — RegisterPersonInput
│   ├── repository/
│   │   ├── port/                    — Interfaces (UserRepo, GrantRepo, ProjectRepo, PersonRepo)
│   │   └── adapter/
│   │       ├── server/              — Zitadel/People HTTP (direct token)
│   │       └── client/              — fetch /api/v1/* (browser, cookie auto-sent)
│   └── service/
│       ├── port/auth-service.ts     — AuthService interface
│       └── adapter/oidc-auth-service.ts — OIDC implementation
│
├── application/                     — Use Cases + Mappers (ACL)
│   ├── usecase/                     — 8 use cases (list, create, toggle, delete, grants, roles)
│   └── mapper/                      — Zitadel raw → domain model
│
├── presenter/                       — Client SPA (bundled → public/app.js)
│   ├── main.ts                      — Client entry: DI + router + mount
│   ├── core/
│   │   ├── reactive.ts              — createSignal, createEffect, createComputed
│   │   ├── router.ts                — pushState router (SPA navigation)
│   │   ├── render.ts                — Event delegation + DOM patching
│   │   └── http.ts                  — fetch wrapper (credentials: same-origin)
│   ├── viewmodel/                   — Reactive: signals → use cases → state
│   │   ├── login.vm.ts
│   │   ├── users-list.vm.ts
│   │   ├── user-detail.vm.ts
│   │   └── user-create.vm.ts
│   └── view/                        — DUMB: state → HTML string, zero logic
│       ├── helpers.ts               — esc() HTML escaping
│       ├── atoms/                   — button, input, badge, link
│       ├── molecules/               — form-field, search-bar, user-row, grant-item
│       ├── organisms/               — user-table, grant-list, role-picker, user-info-card, nav-bar
│       ├── templates/               — authenticated, public
│       └── pages/                   — login, users-list, user-detail, user-create
│
├── server/                          — Elysia server
│   ├── index.ts                     — Entry point (auth + API + shell + static)
│   ├── auth.ts                      — OIDC routes (/auth/login, /auth/callback, /auth/logout)
│   ├── api.ts                       — JSON API: /api/v1/*
│   ├── middleware.ts                — Auth guard, JSON response helpers
│   └── shell.ts                     — HTML shell (SPA entry page)
│
├── build.ts                         — Bun.build script
└── public/                          — Static output (app.js gitignored)
```

### Data Flow

```
Browser → SPA (signals + fetch)
  ├── /api/v1/* → Elysia → Use Case → Repository Adapter → Zitadel/People API
  └── /auth/*   → Elysia → OIDC flow (server-side, httpOnly cookie)
```

### Rules

- **NO classes**. All functional: factory functions, closures, plain objects.
- **Views are DUMB**. They receive typed state and return HTML strings. Zero logic, zero imports from Model.
- **ViewModels own reactivity**. They hold signals, call use cases, and render views.
- **Event delegation via data-action**. Views emit `data-action` attributes; ViewModels bind handlers.
- **Ports & Adapters**. Repository/Service interfaces in `port/`, implementations in `adapter/`.
- **ACL Mappers**. External API shapes → domain models. Only mappers change when APIs change.
- **ApiResult<T>**. Discriminated union replaces thrown errors.
- **readonly everywhere**. All interfaces and return types.

## TypeScript Guidelines

Consult `handbook/reference/typescript/` before writing code.

- `interface` for object shapes, `type` for unions/aliases
- `readonly` on all data properties
- `unknown` over `any` — narrow with type guards
- `as const` for literal arrays and config objects
- Generic type parameters must appear at least twice
- Prefer arrow functions, parameter destructuring

## Environment Variables

- `PORT` (default 3000), `HOST` (default 0.0.0.0)
- `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`
- `SESSION_SECRET`, `BASE_URL`
- `PEOPLE_API_URL` (default https://people.acdgbrasil.com.br)

## Conventions

- **Commits**: Conventional Commits
- **Versioning**: SemVer
- **UI**: Portuguese (pt-BR)
- **HTML escaping**: via `esc()` helper
