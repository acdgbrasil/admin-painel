import type { Project, ProjectRole } from "../../model/grant";
import type { ApiResult } from "../../model/result";

export interface ProjectRepository {
  readonly list: () => Promise<ApiResult<readonly Project[]>>;
  readonly listRoles: (projectId: string) => Promise<ApiResult<readonly ProjectRole[]>>;
  readonly addRole: (projectId: string, roleKey: string) => Promise<ApiResult<null>>;
  readonly removeRole: (projectId: string, roleKey: string) => Promise<ApiResult<null>>;
  readonly listUsersWithGrants: (projectId: string) => Promise<ApiResult<readonly { readonly userId: string; readonly displayName: string; readonly roleKeys: readonly string[] }[]>>;
}
