import type { PersonRepository } from "../../port/person-repository";
import type { HttpClient } from "../../../../presenter/core/http";

export const createApiPersonRepository = (http: HttpClient): PersonRepository => ({
  register: (actorId, input) =>
    http.post("/api/v1/persons", { actorId, ...input }),
});
