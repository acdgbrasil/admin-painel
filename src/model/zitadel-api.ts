// ─── Zitadel Management API client (functional, no classes) ──

import type {
  ZitadelUser,
  UserGrant,
  ProjectRole,
  Project,
  ListResponse,
  CreateUserInput,
  ApiResult,
} from "./types";
import { apiSuccess, apiFailure } from "./types";

const BASE_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

// ─── HTTP helper ─────────────────────────────────────────────

const request = async <T>(token: string, path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return apiFailure(res.status, body);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return apiSuccess(null as T);
  }

  const data = (await res.json()) as T;
  return apiSuccess(data);
};

// ─── Users ───────────────────────────────────────────────────

export const listUsers = (token: string, search?: string): Promise<ApiResult<ListResponse<ZitadelUser>>> => {
  const body: Record<string, unknown> = { query: { limit: 50, offset: 0 } };
  if (search) {
    body["queries"] = [{
      displayNameQuery: {
        displayName: search,
        method: "TEXT_QUERY_METHOD_CONTAINS_IGNORE_CASE",
      },
    }];
  }
  return request(token, "/management/v1/users/_search", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const getUser = (token: string, userId: string): Promise<ApiResult<{ readonly user: ZitadelUser }>> =>
  request(token, `/management/v1/users/${userId}`);

export const createHumanUser = (token: string, input: CreateUserInput): Promise<ApiResult<{ readonly userId: string }>> =>
  request(token, "/v2/users/human", {
    method: "POST",
    body: JSON.stringify({
      username: input.username || input.email,
      profile: {
        givenName: input.firstName,
        familyName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`,
      },
      email: { email: input.email, isVerified: false },
      ...(input.password
        ? { password: { password: input.password, changeRequired: true } }
        : {}),
    }),
  });

export const deleteUser = (token: string, userId: string): Promise<ApiResult<null>> =>
  request(token, `/v2/users/${userId}`, { method: "DELETE" });

export const deactivateUser = (token: string, userId: string): Promise<ApiResult<null>> =>
  request(token, `/v2/users/${userId}/deactivate`, { method: "POST" });

export const reactivateUser = (token: string, userId: string): Promise<ApiResult<null>> =>
  request(token, `/v2/users/${userId}/activate`, { method: "POST" });

// ─── Grants ──────────────────────────────────────────────────

export const listUserGrants = (token: string, userId: string): Promise<ApiResult<ListResponse<UserGrant>>> =>
  request(token, "/management/v1/users/grants/_search", {
    method: "POST",
    body: JSON.stringify({ queries: [{ userIdQuery: { userId } }] }),
  });

export const addUserGrant = (
  token: string,
  userId: string,
  projectId: string,
  roleKeys: readonly string[],
): Promise<ApiResult<{ readonly userGrantId: string }>> =>
  request(token, `/management/v1/users/${userId}/grants`, {
    method: "POST",
    body: JSON.stringify({ projectId, roleKeys }),
  });

export const removeUserGrant = (token: string, userId: string, grantId: string): Promise<ApiResult<null>> =>
  request(token, `/management/v1/users/${userId}/grants/${grantId}`, { method: "DELETE" });

// ─── Projects & Roles ────────────────────────────────────────

export const listProjects = (token: string): Promise<ApiResult<ListResponse<Project>>> =>
  request(token, "/management/v1/projects/_search", {
    method: "POST",
    body: JSON.stringify({ query: { limit: 100 } }),
  });

export const listProjectRoles = (token: string, projectId: string): Promise<ApiResult<ListResponse<ProjectRole>>> =>
  request(token, `/management/v1/projects/${projectId}/roles/_search`, {
    method: "POST",
    body: JSON.stringify({}),
  });
