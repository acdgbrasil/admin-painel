# CLAUDE.md — admin-painel

## Service

Admin panel for ACDG user management. Server-rendered HTML with HTMX interactivity, talking directly to the Zitadel Management API.

## Commands

```bash
bun run dev          # Run with --hot (hot reload)
bun run start        # Run production
bun run typecheck    # TypeScript strict check (bunx tsc)
```

## Stack

- **Runtime**: Bun
- **HTTP**: Elysia
- **Templating**: Tagged template literals (no JSX, no build step)
- **Interactivity**: HTMX (CDN)
- **Styling**: Tailwind CSS (CDN)
- **Auth**: OIDC Authorization Code flow, server-side (httpOnly cookie)
- **API**: Zitadel Management API (direct fetch + Bearer token)

## Architecture — MVVM (Functional)

```
src/
├── model/               — Data layer (types, API calls, auth)
│   ├── types.ts         — Domain types, ApiResult discriminated union
│   ├── auth.ts          — OIDC server-side (discovery, cookie signing)
│   └── zitadel-api.ts   — Zitadel Management API client
├── viewmodel/           — Model → ViewState transformations (pure functions)
│   ├── users.ts         — UsersListViewState
│   ├── user-detail.ts   — UserDetailViewState, GrantRow, RoleOption
│   └── user-form.ts     — Form parsing (unknown → typed)
├── view/                — ViewState → HTML (pure functions, never import Model)
│   ├── layout.ts        — HTML base (head, nav, CDN scripts)
│   ├── login.ts         — Login page
│   ├── users.ts         — User list + row partial
│   ├── user-detail.ts   — User detail + grants/roles partials
│   └── user-new.ts      — Create user form
├── router/              — HTTP routes (auth guard → viewmodel → view → response)
│   ├── middleware.ts     — Auth guard, response helpers
│   ├── auth.ts          — Auth routes (/login, /auth/*)
│   └── users.ts         — User CRUD + grants + HTMX partials
└── index.ts             — App composition (Elysia + routers)
```

### MVVM Flow

```
Request → Router → Model (API call)
                  → ViewModel (transform to ViewState)
                  → View (render HTML from ViewState)
                  → Response
```

### Rules

- **NO classes**. All code is functional: factory functions, closures, plain objects.
- **View never imports Model**. Views receive typed ViewState objects only.
- **ViewModel is pure**. Takes Model data, returns ViewState. No side effects.
- **ApiResult discriminated union** replaces thrown errors: `{ ok: true, data } | { ok: false, status, message }`.
- **Type guards over assertions**. Use `is*` predicates for runtime JSON validation.
- **readonly everywhere**. All interface properties, arrays, and return types are readonly.

## TypeScript Guidelines

Always consult `handbook/reference/typescript/` before writing code.

- `interface` for object shapes, `type` for unions and aliases
- `readonly` on all data properties — immutability by default
- `unknown` instead of `any` — narrow with type guards
- `as const` for literal arrays and config objects
- Prefer arrow functions, parameter destructuring
- Generic type parameters must appear at least twice
- Annotate return types on exported functions

## Environment Variables

- `PORT` (default 3000), `HOST` (default 0.0.0.0)
- `OIDC_ISSUER` (default https://auth.acdgbrasil.com.br)
- `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `SESSION_SECRET`, `BASE_URL`

## Conventions

- **No build step**: Bun runs TypeScript directly
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Versioning**: SemVer. `feat:` → minor, `fix:` → patch
- **UI in Portuguese** (pt-BR)
- **HTML escaping**: All user content escaped via `esc()` helper
