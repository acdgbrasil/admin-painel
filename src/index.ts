// ─── Admin Panel — Entry Point ───────────────────────────────
// Composes routers and starts the server.

import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { authRouter } from "./router/auth";
import { usersRouter } from "./router/users";

const PORT = Number(process.env["PORT"] ?? 3000);
const HOST = process.env["HOST"] ?? "0.0.0.0";

const app = new Elysia()
  .use(html())
  .use(authRouter)
  .use(usersRouter)
  .listen({ port: PORT, hostname: HOST });

console.log(`admin-painel running on ${app.server?.hostname}:${app.server?.port}`);
