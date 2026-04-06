import type { PersonRepository } from "../../port/person-repository";
import type { RegisterPersonInput } from "../../../model/person";
import type { ApiResult } from "../../../model/result";
import { apiSuccess, apiFailure } from "../../../model/result";

const PEOPLE_URL = process.env["PEOPLE_API_URL"] ?? "https://people.acdgbrasil.com.br";

export const createPeoplePersonRepository = (token: string): PersonRepository => ({
  register: async (actorId, input) => {
    const res = await fetch(`${PEOPLE_URL}/api/v1/people`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Actor-Id": actorId,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) return apiFailure(res.status, await res.text());
    const data = (await res.json()) as { data: { id: string } };
    return apiSuccess({ id: data.data.id });
  },
});
