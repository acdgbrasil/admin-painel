import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import {
  getSession,
  getLoginUrl,
  exchangeCodeForSession,
  getLogoutUrl,
  COOKIE_OPTIONS,
  COOKIE_NAME,
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

// ─── Auth helper ─────────────────────────────────────────────

type CookieJar = Record<string, { readonly value: string } | undefined>;

const requireAuth = async (cookie: CookieJar): Promise<Session | null> => {
  const sessionCookie = cookie[COOKIE_NAME];
  return getSession(sessionCookie?.value);
};

const htmlResponse = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { "Content-Type": "text/html" } });

// ─── Form parsing helper ─────────────────────────────────────

const formField = (body: unknown, key: string): string => {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

const formFieldArray = (body: unknown, key: string): readonly string[] => {
  if (typeof body !== "object" || body === null) return [];
  const value = (body as Record<string, unknown>)[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
};

// ─── App ─────────────────────────────────────────────────────

const app = new Elysia()
  .use(html())

  // ─── Auth routes ─────────────────────────────────────────
  .get("/login", () => htmlResponse(loginPage()))

  .get("/auth/login", async () => {
    const url = await getLoginUrl();
    return Response.redirect(url, 302);
  })

  .get("/auth/callback", async ({ query, cookie }) => {
    const code = query["code"];
    if (typeof code !== "string" || !code) return Response.redirect("/login", 302);

    try {
      const { cookie: signedCookie } = await exchangeCodeForSession(code);
      cookie[COOKIE_NAME]!.set({
        value: signedCookie,
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
        maxAge: COOKIE_OPTIONS.maxAge,
      });
      return Response.redirect("/users", 302);
    } catch (err) {
      console.error("[auth] Callback error:", err instanceof Error ? err.message : err);
      return Response.redirect("/login", 302);
    }
  })

  .get("/auth/logout", async ({ cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    cookie[COOKIE_NAME]!.set({ value: "", maxAge: 0, path: "/" });

    if (session) {
      const url = await getLogoutUrl(session.idToken);
      return Response.redirect(url, 302);
    }
    return Response.redirect("/login", 302);
  })

  // ─── Protected routes ────────────────────────────────────
  .get("/", ({ redirect }) => redirect("/users"))

  .get("/users", async ({ query, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    const search = typeof query["search"] === "string" ? query["search"] : undefined;
    const result = await listUsers(session.accessToken, search);

    return htmlResponse(usersPage(session, result.result ?? []));
  })

  .get("/users/new", async ({ cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    return htmlResponse(userNewPage(session));
  })

  .post("/users", async ({ cookie, body }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    try {
      const result = await createHumanUser(session.accessToken, {
        username: formField(body, "username"),
        firstName: formField(body, "firstName"),
        lastName: formField(body, "lastName"),
        email: formField(body, "email"),
        password: formField(body, "password") || undefined,
      });
      return Response.redirect(`/users/${result.userId}`, 303);
    } catch (err) {
      const msg = err instanceof ZitadelApiError
        ? `Erro ${err.status}: ${err.body}`
        : "Erro ao criar usuário";
      return htmlResponse(userNewPage(session, msg), 422);
    }
  })

  .get("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    const { user } = await getUser(session.accessToken, params.id);
    const grantsResult = await listUserGrants(session.accessToken, params.id);
    const projectsResult = await listProjects(session.accessToken);

    return htmlResponse(
      userDetailPage(
        session,
        user,
        grantsResult.result ?? [],
        projectsResult.result ?? [],
      ),
    );
  })

  .post("/users/:id/toggle", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { user } = await getUser(session.accessToken, params.id);
    if (user.state === "USER_STATE_ACTIVE") {
      await deactivateUser(session.accessToken, user.userId);
    } else if (user.state === "USER_STATE_INACTIVE") {
      await reactivateUser(session.accessToken, user.userId);
    }

    const { user: updated } = await getUser(session.accessToken, params.id);
    return htmlResponse(userRowPartial(updated));
  })

  .delete("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return new Response("Unauthorized", { status: 401 });

    await deleteUser(session.accessToken, params.id);
    return Response.redirect("/users", 303);
  })

  // ─── Grants ──────────────────────────────────────────────
  .post("/users/:id/grants", async ({ params, cookie, body }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const projectId = formField(body, "projectId");
    const roleKeys = formFieldArray(body, "roleKeys");
    if (!projectId || roleKeys.length === 0) return new Response("Bad request", { status: 400 });

    await addUserGrant(session.accessToken, params.id, projectId, roleKeys);

    const grantsResult = await listUserGrants(session.accessToken, params.id);
    return htmlResponse(grantsPartial(params.id, grantsResult.result ?? []));
  })

  .delete("/users/:id/grants/:grantId", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return new Response("Unauthorized", { status: 401 });

    await removeUserGrant(session.accessToken, params.id, params.grantId);
    return new Response("", { status: 200 });
  })

  // ─── API (HTMX partials) ────────────────────────────────
  .get("/api/projects/:id/roles", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const result = await listProjectRoles(session.accessToken, params.id);
    return htmlResponse(roleOptionsPartial(result.result ?? []));
  })

  .listen({ port: PORT, hostname: HOST });

console.log(`admin-painel running on ${app.server?.hostname}:${app.server?.port}`);
