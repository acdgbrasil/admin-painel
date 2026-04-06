// ─── JSON API routes (/api/v1/*) ─────────────────────────────

import { Elysia } from "elysia";
import type { AuthService } from "../data/service/port/auth-service";
import { createZitadelUserRepository } from "../data/repository/adapter/server/zitadel-user-repository";
import { createZitadelGrantRepository } from "../data/repository/adapter/server/zitadel-grant-repository";
import { createZitadelProjectRepository } from "../data/repository/adapter/server/zitadel-project-repository";
import { createPeoplePersonRepository } from "../data/repository/adapter/server/people-person-repository";
import { createListUsersUseCase } from "../application/usecase/list-users";
import { createGetUserDetailUseCase } from "../application/usecase/get-user-detail";
import { createCreateUserUseCase } from "../application/usecase/create-user";
import { createToggleUserStateUseCase } from "../application/usecase/toggle-user-state";
import { createDeleteUserUseCase } from "../application/usecase/delete-user";
import { createAddUserGrantUseCase } from "../application/usecase/add-user-grant";
import { createRemoveUserGrantUseCase } from "../application/usecase/remove-user-grant";
import { createListProjectRolesUseCase } from "../application/usecase/list-project-roles";
import { requireSession, jsonResponse, unauthorized, type CookieJar } from "./middleware";

export const createApiRouter = (auth: AuthService) =>
  new Elysia({ prefix: "/api/v1" })

    // ─── Session info ──────────────────────────────────────
    .get("/me", async ({ cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();
      return jsonResponse({ name: session.name, roles: session.roles });
    })

    // ─── Users ─────────────────────────────────────────────
    .post("/users/search", async ({ cookie, body }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const listUsers = createListUsersUseCase(repos);
      const search = (body as { search?: string })?.search;
      const result = await listUsers(search);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .get("/users/:id", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const getDetail = createGetUserDetailUseCase(repos);
      const result = await getDetail(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .post("/users", async ({ cookie, body }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const createUser = createCreateUserUseCase(repos);
      const result = await createUser(body as any);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data, 201);
    })

    .post("/users/:id/toggle", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const toggle = createToggleUserStateUseCase(repos);
      const result = await toggle(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .post("/users/:id/deactivate", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.userRepo.deactivate(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    .post("/users/:id/reactivate", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.userRepo.reactivate(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    .delete("/users/:id", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const deleteUser = createDeleteUserUseCase(repos);
      const result = await deleteUser(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    // ─── Grants ────────────────────────────────────────────
    .get("/users/:id/grants", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.grantRepo.listByUser(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .post("/users/:id/grants", async ({ params, cookie, body }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const form = body as { projectId: string; roleKeys: string[] };
      const addGrant = createAddUserGrantUseCase(repos);
      const result = await addGrant(params.id, form.projectId, form.roleKeys);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .delete("/users/:id/grants/:grantId", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const removeGrant = createRemoveUserGrantUseCase(repos);
      const result = await removeGrant(params.id, params.grantId);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    // ─── Projects ──────────────────────────────────────────
    .get("/projects", async ({ cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.projectRepo.list();
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .get("/projects/:id/roles", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const listRoles = createListProjectRolesUseCase(repos);
      const result = await listRoles(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    .post("/projects/:id/roles", async ({ params, cookie, body }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const form = body as { roleKey: string };
      const result = await repos.projectRepo.addRole(params.id, form.roleKey);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 201 });
    })

    .delete("/projects/:id/roles/:roleKey", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.projectRepo.removeRole(params.id, params.roleKey);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    .get("/projects/:id/users", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.projectRepo.listUsersWithGrants(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return jsonResponse(result.data);
    })

    // ─── User actions ──────────────────────────────────────
    .post("/users/:id/lock", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.userRepo.lock(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    .post("/users/:id/unlock", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.userRepo.unlock(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    })

    .post("/users/:id/reset-password", async ({ params, cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      if (!session) return unauthorized();

      const repos = createRepos(session.accessToken);
      const result = await repos.userRepo.resetPassword(params.id);
      if (!result.ok) return jsonResponse({ error: result.message }, result.status);
      return new Response(null, { status: 204 });
    });

// ─── Repository factory (creates per-request with token) ────

const createRepos = (token: string) => ({
  userRepo: createZitadelUserRepository(token),
  grantRepo: createZitadelGrantRepository(token),
  projectRepo: createZitadelProjectRepository(token),
  personRepo: createPeoplePersonRepository(token),
});
