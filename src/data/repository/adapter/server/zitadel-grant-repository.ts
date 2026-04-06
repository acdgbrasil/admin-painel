import type { GrantRepository } from "../../port/grant-repository";
import type { ApiResult } from "../../../model/result";
import { apiSuccess, apiFailure } from "../../../model/result";
import { mapZitadelGrant } from "../../../../application/mapper/grant-mapper";

const ZITADEL_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

const zitadelRequest = async <T>(token: string, path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const res = await fetch(`${ZITADEL_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!res.ok) return apiFailure(res.status, await res.text());
  if (res.status === 204) return apiSuccess(null as T);
  return apiSuccess((await res.json()) as T);
};

export const createZitadelGrantRepository = (token: string): GrantRepository => ({
  listByUser: async (userId) => {
    const result = await zitadelRequest<{ result?: readonly Record<string, unknown>[] }>(
      token, "/management/v1/users/grants/_search",
      { method: "POST", body: JSON.stringify({ queries: [{ userIdQuery: { userId } }] }) },
    );
    if (!result.ok) return result;
    return apiSuccess((result.data.result ?? []).map(mapZitadelGrant));
  },

  add: async (userId, projectId, roleKeys) => {
    const result = await zitadelRequest<unknown>(token, `/management/v1/users/${userId}/grants`, {
      method: "POST", body: JSON.stringify({ projectId, roleKeys }),
    });
    if (!result.ok) return result;
    return apiSuccess(null);
  },

  remove: (userId, grantId) =>
    zitadelRequest(token, `/management/v1/users/${userId}/grants/${grantId}`, { method: "DELETE" }),
});
