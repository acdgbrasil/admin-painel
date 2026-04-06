// ─── People Context API client (functional) ─────────────────

import type { RegisterPersonInput, RegisterPersonResponse, AssignRoleInput, ApiResult } from "./types";
import { apiSuccess, apiFailure } from "./types";

const PEOPLE_API_URL = process.env["PEOPLE_API_URL"] ?? "https://people.acdgbrasil.com.br";

// ─── HTTP helper ─────────────────────────────────────────────

const request = async <T>(
  token: string,
  actorId: string,
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> => {
  const res = await fetch(`${PEOPLE_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Actor-Id": actorId,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return apiFailure(res.status, body);
  }

  if (res.status === 204) {
    return apiSuccess(null as T);
  }

  const data = (await res.json()) as T;
  return apiSuccess(data);
};

// ─── Register person ─────────────────────────────────────────

export const registerPerson = (
  token: string,
  actorId: string,
  input: RegisterPersonInput,
): Promise<ApiResult<RegisterPersonResponse>> =>
  request(token, actorId, "/api/v1/people", {
    method: "POST",
    body: JSON.stringify(input),
  });

// ─── Assign role ─────────────────────────────────────────────

export const assignRole = (
  token: string,
  actorId: string,
  personId: string,
  input: AssignRoleInput,
): Promise<ApiResult<{ readonly data: { readonly id: string } }>> =>
  request(token, actorId, `/api/v1/people/${personId}/roles`, {
    method: "POST",
    body: JSON.stringify(input),
  });
