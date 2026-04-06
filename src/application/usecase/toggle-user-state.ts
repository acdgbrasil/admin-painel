import type { UserRepository } from "../../data/repository/port/user-repository";
import type { User } from "../../data/model/user";
import type { ApiResult } from "../../data/model/result";

export type ToggleUserStateUseCase = (userId: string) => Promise<ApiResult<User>>;

export const createToggleUserStateUseCase = (deps: {
  readonly userRepo: UserRepository;
}): ToggleUserStateUseCase => async (userId) => {
  const userResult = await deps.userRepo.getById(userId);
  if (!userResult.ok) return userResult;

  const { state } = userResult.data;
  if (state === "active") {
    const r = await deps.userRepo.deactivate(userId);
    if (!r.ok) return r;
  } else if (state === "inactive") {
    const r = await deps.userRepo.reactivate(userId);
    if (!r.ok) return r;
  }

  return deps.userRepo.getById(userId);
};
