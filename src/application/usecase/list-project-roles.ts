import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { ProjectRole } from "../../data/model/grant";
import type { ApiResult } from "../../data/model/result";

export type ListProjectRolesUseCase = (projectId: string) => Promise<ApiResult<readonly ProjectRole[]>>;

export const createListProjectRolesUseCase = (deps: {
  readonly projectRepo: ProjectRepository;
}): ListProjectRolesUseCase => (projectId) => deps.projectRepo.listRoles(projectId);
