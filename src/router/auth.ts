// ─── Auth routes ─────────────────────────────────────────────

import { Elysia } from "elysia";
import { getLoginUrl, exchangeCode, getLogoutUrl, COOKIE_NAME, COOKIE_OPTIONS } from "../model/auth";
import { loginPage } from "../view/login";
import { requireAuth, htmlResponse, type CookieJar } from "./middleware";

export const authRouter = new Elysia()
  .get("/login", () => htmlResponse(loginPage()))

  .get("/auth/login", async () => {
    const url = await getLoginUrl();
    return Response.redirect(url, 302);
  })

  .get("/auth/callback", async ({ query, cookie }) => {
    const code = query["code"];
    if (typeof code !== "string" || !code) return Response.redirect("/login", 302);

    try {
      const { signedCookie } = await exchangeCode(code);
      cookie[COOKIE_NAME]!.set({
        value: signedCookie,
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
        maxAge: COOKIE_OPTIONS.maxAge,
      });
      return Response.redirect("/users", 302);
    } catch (err) {
      console.error("[auth] Callback error:", err instanceof Error ? err.message : err);
      return Response.redirect("/login", 302);
    }
  })

  .get("/auth/logout", async ({ cookie }) => {
    const session = await requireAuth(cookie as CookieJar);
    cookie[COOKIE_NAME]!.set({ value: "", maxAge: 0, path: "/" });

    if (session) {
      const url = await getLogoutUrl(session.idToken);
      return Response.redirect(url, 302);
    }
    return Response.redirect("/login", 302);
  });
