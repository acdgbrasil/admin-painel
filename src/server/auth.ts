// ─── Auth routes (OIDC, server-side) ─────────────────────────

import { Elysia } from "elysia";
import type { AuthService } from "../data/service/port/auth-service";
import { requireSession, type CookieJar } from "./middleware";

export const createAuthRouter = (auth: AuthService) =>
  new Elysia()
    .get("/auth/login", async () => {
      const url = await auth.getLoginUrl();
      return Response.redirect(url, 302);
    })

    .get("/auth/callback", async ({ query, cookie }) => {
      const code = query["code"];
      if (typeof code !== "string" || !code) return Response.redirect("/login", 302);

      try {
        const { signedCookie } = await auth.exchangeCode(code);
        cookie[auth.cookieName]!.set({
          value: signedCookie,
          ...auth.cookieOptions,
        });
        return Response.redirect("/users", 302);
      } catch (err) {
        console.error("[auth] Callback error:", err instanceof Error ? err.message : err);
        return Response.redirect("/login", 302);
      }
    })

    .get("/auth/logout", async ({ cookie }) => {
      const session = await requireSession(auth, cookie as CookieJar);
      cookie[auth.cookieName]!.set({ value: "", maxAge: 0, path: "/" });

      if (session) {
        const url = await auth.getLogoutUrl(session.idToken);
        return Response.redirect(url, 302);
      }
      return Response.redirect("/login", 302);
    });
