// ─── Zitadel Management API client ───────────────────────────
// Server-side only. Receives Bearer token as parameter.

const BASE_URL = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";

// ─── Error type ──────────────────────────────────────────────

export class ZitadelApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Zitadel API error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

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

  // 204 No Content — no body to parse
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }

  return res.json() as Promise<T>;
};

// ─── Types ───────────────────────────────────────────────────

interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
}

interface UserEmail {
  readonly email: string;
  readonly isVerified: boolean;
}

interface UserPhone {
  readonly phone: string;
  readonly isVerified: boolean;
}

interface UserDetails {
  readonly sequence: string;
  readonly creationDate: string;
  readonly changeDate: string;
  readonly resourceOwner: string;
}

export interface ZitadelUser {
  readonly userId: string;
  readonly state: string;
  readonly username: string;
  readonly loginNames: readonly string[];
  readonly preferredLoginName: string;
  readonly human?: {
    readonly profile: UserProfile;
    readonly email: UserEmail;
    readonly phone?: UserPhone;
  };
  readonly details: UserDetails;
}

export interface UserGrant {
  readonly id: string;
  readonly userId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly roleKeys: readonly string[];
  readonly state: number;
  readonly details: {
    readonly creationDate: string;
    readonly changeDate: string;
  };
}

export interface ProjectRole {
  readonly key: string;
  readonly displayName: string;
  readonly group: string;
}

interface Project {
  readonly id: string;
  readonly name: string;
}

// ─── Response wrappers ───────────────────────────────────────

interface ListResponse<T> {
  readonly result?: readonly T[];
  readonly details?: { readonly totalResult: string };
}

// ─── Users ───────────────────────────────────────────────────

export const listUsers = async (token: string, search?: string): Promise<ListResponse<ZitadelUser>> => {
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
  return request<ListResponse<ZitadelUser>>(
    token,
    "/management/v1/users/_search",
    { method: "POST", body: JSON.stringify(body) },
  );
};

export const getUser = async (token: string, userId: string): Promise<{ readonly user: ZitadelUser }> =>
  request(token, `/management/v1/users/${userId}`);

interface CreateUserInput {
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password?: string;
}

export const createHumanUser = async (
  token: string,
  input: CreateUserInput,
): Promise<{ readonly userId: string }> =>
  request(token, "/v2/users/human", {
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
      ...(input.password
        ? { password: { password: input.password, changeRequired: true } }
        : {}),
    }),
  });

export const deleteUser = async (token: string, userId: string): Promise<null> =>
  request(token, `/v2/users/${userId}`, { method: "DELETE" });

export const deactivateUser = async (token: string, userId: string): Promise<null> =>
  request(token, `/v2/users/${userId}/deactivate`, { method: "POST" });

export const reactivateUser = async (token: string, userId: string): Promise<null> =>
  request(token, `/v2/users/${userId}/activate`, { method: "POST" });

// ─── User Grants (roles) ────────────────────────────────────

export const listUserGrants = async (token: string, userId: string): Promise<ListResponse<UserGrant>> =>
  request(token, "/management/v1/users/grants/_search", {
    method: "POST",
    body: JSON.stringify({ queries: [{ userIdQuery: { userId } }] }),
  });

export const addUserGrant = async (
  token: string,
  userId: string,
  projectId: string,
  roleKeys: readonly string[],
): Promise<{ readonly userGrantId: string }> =>
  request(token, `/management/v1/users/${userId}/grants`, {
    method: "POST",
    body: JSON.stringify({ projectId, roleKeys }),
  });

export const removeUserGrant = async (token: string, userId: string, grantId: string): Promise<null> =>
  request(token, `/management/v1/users/${userId}/grants/${grantId}`, { method: "DELETE" });

// ─── Projects & Roles ────────────────────────────────────────

export const listProjects = async (token: string): Promise<ListResponse<Project>> =>
  request(token, "/management/v1/projects/_search", {
    method: "POST",
    body: JSON.stringify({ query: { limit: 100 } }),
  });

export const listProjectRoles = async (token: string, projectId: string): Promise<ListResponse<ProjectRole>> =>
  request(token, `/management/v1/projects/${projectId}/roles/_search`, {
    method: "POST",
    body: JSON.stringify({}),
  });
