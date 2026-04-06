// ─── Session (server-side, from OIDC token exchange) ─────────

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

// ─── SessionInfo (client-side, from /api/v1/me) ─────────────

export interface SessionInfo {
  readonly name: string;
  readonly roles: readonly string[];
}
