import type { UserRepository } from "../../port/user-repository";
import type { CreateUserInput } from "../../../model/user";
import type { ApiResult } from "../../../model/result";
import { apiSuccess, apiFailure } from "../../../model/result";
import { mapZitadelUser } from "../../../../application/mapper/user-mapper";

const ZITADEL_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

const zitadelRequest = async <T>(token: string, path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const res = await fetch(`${ZITADEL_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) return apiFailure(res.status, await res.text());
  if (res.status === 204) return apiSuccess(null as T);
  return apiSuccess((await res.json()) as T);
};

export const createZitadelUserRepository = (token: string): UserRepository => ({
  list: async (search) => {
    const body: Record<string, unknown> = { query: { limit: 50, offset: 0 } };
    if (search) {
      body["queries"] = [{ displayNameQuery: { displayName: search, method: "TEXT_QUERY_METHOD_CONTAINS_IGNORE_CASE" } }];
    }
    const result = await zitadelRequest<{ result?: readonly Record<string, unknown>[] }>(
      token, "/management/v1/users/_search", { method: "POST", body: JSON.stringify(body) },
    );
    if (!result.ok) return result;
    const users = (result.data.result ?? []).map(mapZitadelUser);
    return apiSuccess(users);
  },

  getById: async (userId) => {
    const result = await zitadelRequest<{ user: Record<string, unknown> }>(token, `/management/v1/users/${userId}`);
    if (!result.ok) return result;
    return apiSuccess(mapZitadelUser(result.data.user));
  },

  create: async (input: CreateUserInput) => {
    return zitadelRequest(token, "/v2/users/human", {
      method: "POST",
      body: JSON.stringify({
        username: input.username ?? input.email,
        profile: { givenName: input.firstName, familyName: input.lastName, displayName: `${input.firstName} ${input.lastName}` },
        email: { email: input.email, isVerified: false },
        ...(input.password ? { password: { password: input.password, changeRequired: true } } : {}),
      }),
    });
  },

  remove: (userId) => zitadelRequest(token, `/v2/users/${userId}`, { method: "DELETE" }),
  deactivate: (userId) => zitadelRequest(token, `/v2/users/${userId}/deactivate`, { method: "POST" }),
  reactivate: (userId) => zitadelRequest(token, `/v2/users/${userId}/activate`, { method: "POST" }),
  lock: (userId) => zitadelRequest(token, `/v2/users/${userId}/lock`, { method: "POST" }),
  unlock: (userId) => zitadelRequest(token, `/v2/users/${userId}/unlock`, { method: "POST" }),
  resetPassword: (userId) => zitadelRequest(token, `/v2/users/${userId}/password_reset`, { method: "POST", body: JSON.stringify({}) }),
});
