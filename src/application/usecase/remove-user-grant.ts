import type { GrantRepository } from "../../data/repository/port/grant-repository";
import type { ApiResult } from "../../data/model/result";

export type RemoveUserGrantUseCase = (userId: string, grantId: string) => Promise<ApiResult<null>>;

export const createRemoveUserGrantUseCase = (deps: {
  readonly grantRepo: GrantRepository;
}): RemoveUserGrantUseCase => (userId, grantId) => deps.grantRepo.remove(userId, grantId);
