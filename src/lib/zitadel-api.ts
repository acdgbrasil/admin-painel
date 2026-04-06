import { getAccessToken } from "./auth";

// ─── Config ──────────────────────────────────────────────────

const BASE_URL = "https://auth.acdgbrasil.com.br";

// ─── HTTP helpers ────────────────────────────────────────────

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
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

export type CreateHumanUserRequest = {
  username: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
  };
  email: {
    email: string;
    isVerified?: boolean;
  };
  password?: {
    password: string;
    changeRequired?: boolean;
  };
};

// ─── Users ───────────────────────────────────────────────────

export const listUsers = async (query?: {
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  const body: Record<string, unknown> = {
    query: {
      limit: query?.limit ?? 50,
      offset: query?.offset ?? 0,
    },
  };

  if (query?.search) {
    body.queries = [
      {
        displayNameQuery: {
          displayName: query.search,
          method: "TEXT_QUERY_METHOD_CONTAINS_IGNORE_CASE",
        },
      },
    ];
  }

  return request<{ result: ZitadelUser[]; details: { totalResult: string } }>(
    "/management/v1/users/_search",
    { method: "POST", body: JSON.stringify(body) },
  );
};

export const getUser = async (userId: string) =>
  request<{ user: ZitadelUser }>(`/management/v1/users/${userId}`);

export const createHumanUser = async (input: CreateHumanUserRequest) =>
  request<{ userId: string }>("/v2/users/human", {
    method: "POST",
    body: JSON.stringify({
      username: input.username,
      profile: {
        givenName: input.profile.firstName,
        familyName: input.profile.lastName,
        displayName: input.profile.displayName ?? `${input.profile.firstName} ${input.profile.lastName}`,
      },
      email: {
        email: input.email.email,
        isVerified: input.email.isVerified ?? false,
      },
      ...(input.password && {
        password: {
          password: input.password.password,
          changeRequired: input.password.changeRequired ?? true,
        },
      }),
    }),
  });

export const deleteUser = async (userId: string) =>
  request<void>(`/v2/users/${userId}`, { method: "DELETE" });

export const deactivateUser = async (userId: string) =>
  request<void>(`/v2/users/${userId}/deactivate`, { method: "POST" });

export const reactivateUser = async (userId: string) =>
  request<void>(`/v2/users/${userId}/activate`, { method: "POST" });

// ─── User Grants (roles) ────────────────────────────────────

export const listUserGrants = async (userId: string) =>
  request<{ result?: UserGrant[] }>(
    "/management/v1/users/grants/_search",
    {
      method: "POST",
      body: JSON.stringify({
        queries: [{ userIdQuery: { userId } }],
      }),
    },
  );

export const addUserGrant = async (userId: string, projectId: string, roleKeys: string[]) =>
  request<{ userGrantId: string }>(`/management/v1/users/${userId}/grants`, {
    method: "POST",
    body: JSON.stringify({ projectId, roleKeys }),
  });

export const updateUserGrant = async (userId: string, grantId: string, roleKeys: string[]) =>
  request<void>(`/management/v1/users/${userId}/grants/${grantId}`, {
    method: "PUT",
    body: JSON.stringify({ roleKeys }),
  });

export const removeUserGrant = async (userId: string, grantId: string) =>
  request<void>(`/management/v1/users/${userId}/grants/${grantId}`, {
    method: "DELETE",
  });

// ─── Projects & Roles (for role picker) ─────────────────────

export type ProjectRole = {
  key: string;
  displayName: string;
  group: string;
};

export const listProjectRoles = async (projectId: string) =>
  request<{ result?: ProjectRole[] }>(`/management/v1/projects/${projectId}/roles/_search`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const listProjects = async () =>
  request<{ result?: Array<{ id: string; name: string }> }>("/management/v1/projects/_search", {
    method: "POST",
    body: JSON.stringify({ query: { limit: 100 } }),
  });
