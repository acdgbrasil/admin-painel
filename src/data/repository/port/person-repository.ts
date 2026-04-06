import type { RegisterPersonInput } from "../../model/person";
import type { ApiResult } from "../../model/result";

export interface PersonRepository {
  readonly register: (actorId: string, input: RegisterPersonInput) => Promise<ApiResult<{ readonly id: string }>>;
}
