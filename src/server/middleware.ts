// ─── Server middleware ────────────────────────────────────────

import type { Session } from "../data/model/session";
import type { AuthService } from "../data/service/port/auth-service";

export type CookieJar = Record<string, { readonly value: string } | undefined>;

export const requireSession = async (
  auth: AuthService,
  cookie: CookieJar,
): Promise<Session | null> => {
  const raw = cookie[auth.cookieName];
  return auth.getSession(raw?.value);
};

export const jsonResponse = <T>(data: T, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const unauthorized = (): Response =>
  new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
