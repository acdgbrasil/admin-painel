import type { User, CreateUserInput } from "../../model/user";
import type { ApiResult } from "../../model/result";

export interface UserRepository {
  readonly list: (search?: string) => Promise<ApiResult<readonly User[]>>;
  readonly getById: (userId: string) => Promise<ApiResult<User>>;
  readonly create: (input: CreateUserInput) => Promise<ApiResult<{ readonly userId: string }>>;
  readonly remove: (userId: string) => Promise<ApiResult<null>>;
  readonly deactivate: (userId: string) => Promise<ApiResult<null>>;
  readonly reactivate: (userId: string) => Promise<ApiResult<null>>;
}
