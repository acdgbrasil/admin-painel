// ─── Server Entry Point ──────────────────────────────────────

import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { createOidcAuthService } from "../data/service/adapter/oidc-auth-service";
import { createAuthRouter } from "./auth";
import { createApiRouter } from "./api";
import { renderShell } from "./shell";

const PORT = Number(process.env["PORT"] ?? 3000);
const HOST = process.env["HOST"] ?? "0.0.0.0";

const auth = createOidcAuthService();

const app = new Elysia()
  .use(html())
  .use(createAuthRouter(auth))
  .use(createApiRouter(auth))

  // Static: serve client bundle
  .get("/app.js", () => new Response(Bun.file("public/app.js"), {
    headers: { "Content-Type": "application/javascript" },
  }))

  // SPA catch-all: serve HTML shell for all client routes
  .get("/login", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/users", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/users/new", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/users/:id", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/projects", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/projects/:id", () => new Response(renderShell(), { headers: { "Content-Type": "text/html" } }))
  .get("/", ({ redirect }) => redirect("/users"))

  .listen({ port: PORT, hostname: HOST });

console.log(`admin-painel running on ${app.server?.hostname}:${app.server?.port}`);
