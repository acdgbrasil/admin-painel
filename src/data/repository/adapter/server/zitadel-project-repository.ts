import type { ProjectRepository } from "../../port/project-repository";
import type { Project, ProjectRole } from "../../../model/grant";
import type { ApiResult } from "../../../model/result";
import { apiSuccess, apiFailure } from "../../../model/result";

const ZITADEL_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

const zitadelRequest = async <T>(token: string, path: string, options: RequestInit = {}): Promise<ApiResult<T>> => {
  const res = await fetch(`${ZITADEL_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!res.ok) return apiFailure(res.status, await res.text());
  return apiSuccess((await res.json()) as T);
};

export const createZitadelProjectRepository = (token: string): ProjectRepository => ({
  list: async () => {
    const result = await zitadelRequest<{ result?: readonly { id: string; name: string }[] }>(
      token, "/management/v1/projects/_search", { method: "POST", body: JSON.stringify({ query: { limit: 100 } }) },
    );
    if (!result.ok) return result;
    return apiSuccess((result.data.result ?? []).map((p): Project => ({ id: p.id, name: p.name })));
  },

  listRoles: async (projectId) => {
    const result = await zitadelRequest<{ result?: readonly { key: string; displayName: string }[] }>(
      token, `/management/v1/projects/${projectId}/roles/_search`, { method: "POST", body: JSON.stringify({}) },
    );
    if (!result.ok) return result;
    return apiSuccess((result.data.result ?? []).map((r): ProjectRole => ({ key: r.key, displayName: r.displayName })));
  },
});
