import type { UserGrant } from "../../model/grant";
import type { ApiResult } from "../../model/result";

export interface GrantRepository {
  readonly listByUser: (userId: string) => Promise<ApiResult<readonly UserGrant[]>>;
  readonly add: (userId: string, projectId: string, roleKeys: readonly string[]) => Promise<ApiResult<null>>;
  readonly remove: (userId: string, grantId: string) => Promise<ApiResult<null>>;
}
