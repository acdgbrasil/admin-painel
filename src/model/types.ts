// ─── Session ─────────────────────────────────────────────────

export interface Session {
  readonly accessToken: string;
  readonly idToken: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly expiresAt: number;
}

export const isSession = (value: unknown): value is Session =>
  typeof value === "object" &&
  value !== null &&
  "accessToken" in value &&
  "idToken" in value &&
  "expiresAt" in value &&
  typeof (value as { expiresAt: unknown }).expiresAt === "number";

// ─── Zitadel User ────────────────────────────────────────────

export interface ZitadelUser {
  readonly userId: string;
  readonly state: string;
  readonly username: string;
  readonly loginNames: readonly string[];
  readonly preferredLoginName: string;
  readonly human?: {
    readonly profile: {
      readonly firstName: string;
      readonly lastName: string;
      readonly displayName: string;
    };
    readonly email: {
      readonly email: string;
      readonly isVerified: boolean;
    };
    readonly phone?: {
      readonly phone: string;
      readonly isVerified: boolean;
    };
  };
  readonly details: {
    readonly sequence: string;
    readonly creationDate: string;
    readonly changeDate: string;
    readonly resourceOwner: string;
  };
}

// ─── Grants & Roles ──────────────────────────────────────────

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

export interface Project {
  readonly id: string;
  readonly name: string;
}

// ─── API Result (discriminated union, replaces class) ────────

interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

interface ApiFailure {
  readonly ok: false;
  readonly status: number;
  readonly message: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export const apiSuccess = <T>(data: T): ApiResult<T> => ({ ok: true, data });
export const apiFailure = (status: number, message: string): ApiResult<never> => ({ ok: false, status, message });

// ─── List response ───────────────────────────────────────────

export interface ListResponse<T> {
  readonly result?: readonly T[];
  readonly details?: { readonly totalResult: string };
}

// ─── Create user input ───────────────────────────────────────

export interface CreateUserInput {
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password?: string;
}
