import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import {
  getSession,
  getLoginUrl,
  exchangeCodeForSession,
  getLogoutUrl,
  COOKIE_OPTIONS,
  COOKIE_NAME_EXPORT,
  type Session,
} from "./auth";
import {
  listUsers,
  getUser,
  createHumanUser,
  deleteUser,
  deactivateUser,
  reactivateUser,
  listUserGrants,
  addUserGrant,
  removeUserGrant,
  listProjects,
  listProjectRoles,
  ZitadelApiError,
} from "./zitadel";
import { loginPage } from "./views/login";
import { usersPage, userRowPartial } from "./views/users";
import { userDetailPage, grantsPartial, roleOptionsPartial } from "./views/user-detail";
import { userNewPage } from "./views/user-new";

const PORT = Number(process.env["PORT"] ?? 3000);
const HOST = process.env["HOST"] ?? "0.0.0.0";

// ─── Auth middleware helper ──────────────────────────────────

const requireAuth = async (cookie: Record<string, { value: string }>): Promise<Session | null> => {
  const sessionCookie = cookie[COOKIE_NAME_EXPORT];
  return getSession(sessionCookie?.value);
};

// ─── App ─────────────────────────────────────────────────────

const app = new Elysia()
  .use(html())

  // ─── Auth routes ─────────────────────────────────────────
  .get("/login", () => new Response(loginPage(), { headers: { "Content-Type": "text/html" } }))

  .get("/auth/login", async () => {
    const url = await getLoginUrl();
    return Response.redirect(url, 302);
  })

  .get("/auth/callback", async ({ query, cookie }) => {
    const code = query["code"];
    if (!code) return Response.redirect("/login", 302);

    try {
      const { session, cookie: signedCookie } = await exchangeCodeForSession(code);
      cookie[COOKIE_NAME_EXPORT]!.set({
        value: signedCookie,
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
        maxAge: COOKIE_OPTIONS.maxAge,
      });
      void session;
      return Response.redirect("/users", 302);
    } catch (err) {
      console.error("[auth] Callback error:", err);
      return Response.redirect("/login", 302);
    }
  })

  .get("/auth/logout", async ({ cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    cookie[COOKIE_NAME_EXPORT]!.set({ value: "", maxAge: 0, path: "/" });

    if (session) {
      const url = await getLogoutUrl(session.idToken);
      return Response.redirect(url, 302);
    }
    return Response.redirect("/login", 302);
  })

  // ─── Protected routes ────────────────────────────────────
  .get("/", ({ redirect }) => redirect("/users"))

  .get("/users", async ({ query, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return Response.redirect("/login", 302);

    const search = query["search"] as string | undefined;
    const result = await listUsers(session.accessToken, search);
    const users = result.result ?? [];

    return new Response(usersPage(session, users, search), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .get("/users/new", async ({ cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return Response.redirect("/login", 302);

    return new Response(userNewPage(session), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .post("/users", async ({ cookie, body }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return Response.redirect("/login", 302);

    const form = body as Record<string, string>;
    try {
      const result = await createHumanUser(session.accessToken, {
        username: form["username"] ?? "",
        firstName: form["firstName"] ?? "",
        lastName: form["lastName"] ?? "",
        email: form["email"] ?? "",
        password: form["password"] || undefined,
      });
      return Response.redirect(`/users/${result.userId}`, 303);
    } catch (err) {
      const msg = err instanceof ZitadelApiError ? `Erro ${err.status}: ${err.body}` : "Erro ao criar usuário";
      return new Response(userNewPage(session, msg), {
        status: 422,
        headers: { "Content-Type": "text/html" },
      });
    }
  })

  .get("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return Response.redirect("/login", 302);

    const { user } = await getUser(session.accessToken, params.id);
    const grantsResult = await listUserGrants(session.accessToken, params.id);
    const grants = grantsResult.result ?? [];
    const projectsResult = await listProjects(session.accessToken);
    const projects = projectsResult.result ?? [];

    return new Response(userDetailPage(session, user, grants, projects), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .post("/users/:id/toggle", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { user } = await getUser(session.accessToken, params.id);
    if (user.state === "USER_STATE_ACTIVE") {
      await deactivateUser(session.accessToken, user.userId);
    } else if (user.state === "USER_STATE_INACTIVE") {
      await reactivateUser(session.accessToken, user.userId);
    }

    // Check if HTMX request — return partial, else redirect
    const { user: updated } = await getUser(session.accessToken, params.id);

    return new Response(userRowPartial(updated), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .delete("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return new Response("Unauthorized", { status: 401 });

    await deleteUser(session.accessToken, params.id);
    return Response.redirect("/users", 303);
  })

  // ─── Grants ──────────────────────────────────────────────
  .post("/users/:id/grants", async ({ params, cookie, body }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const form = body as Record<string, string | string[]>;
    const projectId = form["projectId"] as string;
    let roleKeys = form["roleKeys"];
    if (typeof roleKeys === "string") roleKeys = [roleKeys];
    if (!roleKeys || !projectId) return new Response("Bad request", { status: 400 });

    await addUserGrant(session.accessToken, params.id, projectId, roleKeys as string[]);

    const grantsResult = await listUserGrants(session.accessToken, params.id);
    return new Response(grantsPartial(params.id, grantsResult.result ?? []), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .delete("/users/:id/grants/:grantId", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return new Response("Unauthorized", { status: 401 });

    await removeUserGrant(session.accessToken, params.id, params.grantId);
    return new Response("", { status: 200 });
  })

  // ─── API (HTMX partials) ────────────────────────────────
  .get("/api/projects/:id/roles", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as Record<string, { value: string }>);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const result = await listProjectRoles(session.accessToken, params.id);
    return new Response(roleOptionsPartial(result.result ?? []), {
      headers: { "Content-Type": "text/html" },
    });
  })

  .listen({ port: PORT, hostname: HOST });

console.log(`admin-painel running on ${app.server?.hostname}:${app.server?.port}`);
