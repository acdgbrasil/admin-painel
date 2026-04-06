import type { UserRepository } from "../../data/repository/port/user-repository";
import type { ApiResult } from "../../data/model/result";

export type DeleteUserUseCase = (userId: string) => Promise<ApiResult<null>>;

export const createDeleteUserUseCase = (deps: {
  readonly userRepo: UserRepository;
}): DeleteUserUseCase => (userId) => deps.userRepo.remove(userId);
