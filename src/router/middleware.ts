// ─── Shared middleware & helpers ─────────��────────────────────

import type { Session } from "../model/types";
import { getSession, COOKIE_NAME } from "../model/auth";

export type CookieJar = Record<string, { readonly value: string } | undefined>;

export const requireAuth = async (cookie: CookieJar): Promise<Session | null> => {
  const sessionCookie = cookie[COOKIE_NAME];
  return getSession(sessionCookie?.value);
};

export const htmlResponse = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { "Content-Type": "text/html" } });

export const unauthorized = (): Response =>
  new Response("Unauthorized", { status: 401 });

export const badRequest = (msg = "Bad request"): Response =>
  new Response(msg, { status: 400 });
