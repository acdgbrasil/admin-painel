import type { UserRepository } from "../../data/repository/port/user-repository";
import type { GrantRepository } from "../../data/repository/port/grant-repository";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { User } from "../../data/model/user";
import type { UserGrant, Project } from "../../data/model/grant";
import type { ApiResult } from "../../data/model/result";
import { apiSuccess } from "../../data/model/result";

export interface UserDetailResult {
  readonly user: User;
  readonly grants: readonly UserGrant[];
  readonly projects: readonly Project[];
}

export type GetUserDetailUseCase = (userId: string) => Promise<ApiResult<UserDetailResult>>;

export const createGetUserDetailUseCase = (deps: {
  readonly userRepo: UserRepository;
  readonly grantRepo: GrantRepository;
  readonly projectRepo: ProjectRepository;
}): GetUserDetailUseCase => async (userId) => {
  const userResult = await deps.userRepo.getById(userId);
  if (!userResult.ok) return userResult;

  const [grantsResult, projectsResult] = await Promise.all([
    deps.grantRepo.listByUser(userId),
    deps.projectRepo.list(),
  ]);

  return apiSuccess({
    user: userResult.data,
    grants: grantsResult.ok ? grantsResult.data : [],
    projects: projectsResult.ok ? projectsResult.data : [],
  });
};
