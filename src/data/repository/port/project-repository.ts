import type { Project, ProjectRole } from "../../model/grant";
import type { ApiResult } from "../../model/result";

export interface ProjectRepository {
  readonly list: () => Promise<ApiResult<readonly Project[]>>;
  readonly listRoles: (projectId: string) => Promise<ApiResult<readonly ProjectRole[]>>;
}
