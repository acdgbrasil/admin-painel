import type { UserRepository } from "../../data/repository/port/user-repository";
import type { User } from "../../data/model/user";
import type { ApiResult } from "../../data/model/result";

export type ListUsersUseCase = (search?: string) => Promise<ApiResult<readonly User[]>>;

export const createListUsersUseCase = (deps: {
  readonly userRepo: UserRepository;
}): ListUsersUseCase => (search) => deps.userRepo.list(search);
