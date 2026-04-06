import type { ProjectRepository } from "../../port/project-repository";
import type { HttpClient } from "../../../../presenter/core/http";
import type { Project, ProjectRole } from "../../../model/grant";

export const createApiProjectRepository = (http: HttpClient): ProjectRepository => ({
  list: () => http.get<readonly Project[]>("/api/v1/projects"),
  listRoles: (projectId) => http.get<readonly ProjectRole[]>(`/api/v1/projects/${projectId}/roles`),
  addRole: (projectId, roleKey) => http.post(`/api/v1/projects/${projectId}/roles`, { roleKey }),
  removeRole: (projectId, roleKey) => http.del(`/api/v1/projects/${projectId}/roles/${roleKey}`),
  listUsersWithGrants: (projectId) => http.get(`/api/v1/projects/${projectId}/users`),
});
