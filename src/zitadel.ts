// ─── Zitadel Management API client ───────────────────────────
// Same logic as the SolidJS version, but receives token as parameter
// instead of pulling from client-side auth.

const BASE_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

// ─── HTTP helpers ────────────────────────────────────────────

const request = async <T>(token: string, path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ZitadelApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
};

export class ZitadelApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Zitadel API error ${status}: ${body}`);
  }
}

// ─── Types ───────────────────────────────────────────────────

export type ZitadelUser = {
  userId: string;
  state: string;
  username: string;
  loginNames: string[];
  preferredLoginName: string;
  human?: {
    profile: {
      firstName: string;
      lastName: string;
      displayName: string;
    };
    email: {
      email: string;
      isVerified: boolean;
    };
    phone?: {
      phone: string;
      isVerified: boolean;
    };
  };
  details: {
    sequence: string;
    creationDate: string;
    changeDate: string;
    resourceOwner: string;
  };
};

export type UserGrant = {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  roleKeys: string[];
  state: number;
  details: {
    creationDate: string;
    changeDate: string;
  };
};

export type ProjectRole = {
  key: string;
  displayName: string;
  group: string;
};

// ─── Users ───────────────────────────────────────────────────

export const listUsers = async (token: string, search?: string) => {
  const body: Record<string, unknown> = {
    query: { limit: 50, offset: 0 },
  };
  if (search) {
    body["queries"] = [
      {
        displayNameQuery: {
          displayName: search,
          method: "TEXT_QUERY_METHOD_CONTAINS_IGNORE_CASE",
        },
      },
    ];
  }
  return request<{ result?: ZitadelUser[]; details?: { totalResult: string } }>(
    token,
    "/management/v1/users/_search",
    { method: "POST", body: JSON.stringify(body) },
  );
};

export const getUser = async (token: string, userId: string) =>
  request<{ user: ZitadelUser }>(token, `/management/v1/users/${userId}`);

export const createHumanUser = async (
  token: string,
  input: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
  },
) =>
  request<{ userId: string }>(token, "/v2/users/human", {
    method: "POST",
    body: JSON.stringify({
      username: input.username || input.email,
      profile: {
        givenName: input.firstName,
        familyName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`,
      },
      email: {
        email: input.email,
        isVerified: false,
      },
      ...(input.password && {
        password: {
          password: input.password,
          changeRequired: true,
        },
      }),
    }),
  });

export const deleteUser = async (token: string, userId: string) =>
  request<void>(token, `/v2/users/${userId}`, { method: "DELETE" });

export const deactivateUser = async (token: string, userId: string) =>
  request<void>(token, `/v2/users/${userId}/deactivate`, { method: "POST" });

export const reactivateUser = async (token: string, userId: string) =>
  request<void>(token, `/v2/users/${userId}/activate`, { method: "POST" });

// ─── User Grants (roles) ────────────────────────────────────

export const listUserGrants = async (token: string, userId: string) =>
  request<{ result?: UserGrant[] }>(token, "/management/v1/users/grants/_search", {
    method: "POST",
    body: JSON.stringify({ queries: [{ userIdQuery: { userId } }] }),
  });

export const addUserGrant = async (token: string, userId: string, projectId: string, roleKeys: string[]) =>
  request<{ userGrantId: string }>(token, `/management/v1/users/${userId}/grants`, {
    method: "POST",
    body: JSON.stringify({ projectId, roleKeys }),
  });

export const removeUserGrant = async (token: string, userId: string, grantId: string) =>
  request<void>(token, `/management/v1/users/${userId}/grants/${grantId}`, { method: "DELETE" });

// ─── Projects & Roles ────────────────────────────────────────

export const listProjects = async (token: string) =>
  request<{ result?: Array<{ id: string; name: string }> }>(token, "/management/v1/projects/_search", {
    method: "POST",
    body: JSON.stringify({ query: { limit: 100 } }),
  });

export const listProjectRoles = async (token: string, projectId: string) =>
  request<{ result?: ProjectRole[] }>(token, `/management/v1/projects/${projectId}/roles/_search`, {
    method: "POST",
    body: JSON.stringify({}),
  });
