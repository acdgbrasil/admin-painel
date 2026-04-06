import type { GrantRepository } from "../../data/repository/port/grant-repository";
import type { UserGrant } from "../../data/model/grant";
import type { ApiResult } from "../../data/model/result";

export type AddUserGrantUseCase = (
  userId: string,
  projectId: string,
  roleKeys: readonly string[],
) => Promise<ApiResult<readonly UserGrant[]>>;

export const createAddUserGrantUseCase = (deps: {
  readonly grantRepo: GrantRepository;
}): AddUserGrantUseCase => async (userId, projectId, roleKeys) => {
  const addResult = await deps.grantRepo.add(userId, projectId, roleKeys);
  if (!addResult.ok) return addResult;
  return deps.grantRepo.listByUser(userId);
};
