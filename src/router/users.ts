// ─── User routes ─────────────────────────────────────────────

import { Elysia } from "elysia";
import * as api from "../model/zitadel-api";
import * as peopleApi from "../model/people-api";
import { toUsersListViewState, toUserRow } from "../viewmodel/users";
import { toUserDetailViewState, toGrantsViewState, toRoleOptions } from "../viewmodel/user-detail";
import { parseCreateUserForm, parseRegisterPersonForm, parseGrantForm } from "../viewmodel/user-form";
import { usersPage, userRowPartial } from "../view/users";
import { userDetailPage, grantsPartial, roleOptionsPartial } from "../view/user-detail";
import { userNewPage } from "../view/user-new";
import { requireAuth, htmlResponse, unauthorized, badRequest, type CookieJar } from "./middleware";

export const usersRouter = new Elysia()
  .get("/", ({ redirect }) => redirect("/users"))

  .get("/users", async ({ query, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    const search = typeof query["search"] === "string" ? query["search"] : undefined;
    const result = await api.listUsers(session.accessToken, search);
    if (!result.ok) return htmlResponse(`<p>Erro: ${result.message}</p>`, result.status);

    const viewState = toUsersListViewState(
      session.name,
      session.roles,
      result.data.result ?? [],
      search,
    );
    return htmlResponse(usersPage(viewState));
  })

  .get("/users/new", async ({ cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    return htmlResponse(userNewPage({
      userName: session.name,
      userRoles: session.roles.join(", "),
    }));
  })

  .post("/users", async ({ cookie, body }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    const viewState = { userName: session.name, userRoles: session.roles.join(", ") };
    const zitadelInput = parseCreateUserForm(body);

    // 1. Create user in Zitadel
    const zitadelResult = await api.createHumanUser(session.accessToken, zitadelInput);
    if (!zitadelResult.ok) {
      return htmlResponse(
        userNewPage({ ...viewState, error: `Erro Zitadel: ${zitadelResult.message}` }),
        422,
      );
    }

    // 2. Register person in People Context
    const fullName = `${zitadelInput.firstName} ${zitadelInput.lastName}`.trim();
    const personInput = parseRegisterPersonForm(body, fullName);

    if (personInput.birthDate) {
      const personResult = await peopleApi.registerPerson(
        session.accessToken,
        zitadelResult.data.userId,
        personInput,
      );

      if (!personResult.ok) {
        console.error("[people-context] Registration failed:", personResult.message);
      }
    }

    return Response.redirect(`/users/${zitadelResult.data.userId}`, 303);
  })

  .get("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return Response.redirect("/login", 302);

    const userResult = await api.getUser(session.accessToken, params.id);
    if (!userResult.ok) return htmlResponse(`<p>Erro: ${userResult.message}</p>`, userResult.status);

    const grantsResult = await api.listUserGrants(session.accessToken, params.id);
    const projectsResult = await api.listProjects(session.accessToken);

    const viewState = toUserDetailViewState(
      session.name,
      session.roles,
      userResult.data.user,
      grantsResult.ok ? grantsResult.data.result ?? [] : [],
      projectsResult.ok ? projectsResult.data.result ?? [] : [],
    );
    return htmlResponse(userDetailPage(viewState));
  })

  .post("/users/:id/toggle", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return unauthorized();

    const userResult = await api.getUser(session.accessToken, params.id);
    if (!userResult.ok) return htmlResponse(userResult.message, userResult.status);

    const { user } = userResult.data;
    if (user.state === "USER_STATE_ACTIVE") {
      await api.deactivateUser(session.accessToken, user.userId);
    } else if (user.state === "USER_STATE_INACTIVE") {
      await api.reactivateUser(session.accessToken, user.userId);
    }

    const updatedResult = await api.getUser(session.accessToken, params.id);
    if (!updatedResult.ok) return htmlResponse(updatedResult.message, updatedResult.status);

    return htmlResponse(userRowPartial(toUserRow(updatedResult.data.user)));
  })

  .delete("/users/:id", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return unauthorized();

    await api.deleteUser(session.accessToken, params.id);
    return Response.redirect("/users", 303);
  })

  // ─── Grants ──────────────────────────────────────────────
  .post("/users/:id/grants", async ({ params, cookie, body }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return unauthorized();

    const form = parseGrantForm(body);
    if (!form.projectId || form.roleKeys.length === 0) return badRequest();

    await api.addUserGrant(session.accessToken, params.id, form.projectId, form.roleKeys);

    const grantsResult = await api.listUserGrants(session.accessToken, params.id);
    const grants = grantsResult.ok ? grantsResult.data.result ?? [] : [];
    return htmlResponse(grantsPartial(params.id, toGrantsViewState(grants)));
  })

  .delete("/users/:id/grants/:grantId", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return unauthorized();

    await api.removeUserGrant(session.accessToken, params.id, params.grantId);
    return new Response("", { status: 200 });
  })

  // ─── HTMX API ────────────────────────────────────────────
  .get("/api/projects/:id/roles", async ({ params, cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    if (!session) return unauthorized();

    const result = await api.listProjectRoles(session.accessToken, params.id);
    const roles = result.ok ? result.data.result ?? [] : [];
    return htmlResponse(roleOptionsPartial(toRoleOptions(roles)));
  });
