import type { GrantRepository } from "../../port/grant-repository";
import type { HttpClient } from "../../../../presenter/core/http";
import type { UserGrant } from "../../../model/grant";

export const createApiGrantRepository = (http: HttpClient): GrantRepository => ({
  listByUser: (userId) => http.get<readonly UserGrant[]>(`/api/v1/users/${userId}/grants`),
  add: (userId, projectId, roleKeys) =>
    http.post(`/api/v1/users/${userId}/grants`, { projectId, roleKeys }),
  remove: (userId, grantId) => http.del(`/api/v1/users/${userId}/grants/${grantId}`),
});
