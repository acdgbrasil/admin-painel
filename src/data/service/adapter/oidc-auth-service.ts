// ─── OIDC Auth Service (server-side only) ────────────────────
// Migrated from the previous model/auth.ts — same logic.

import type { AuthService } from "../port/auth-service";
import type { Session } from "../../model/session";
import { isSession } from "../../model/session";

// ─── Config ──────────────────────────────────────────────────

const ISSUER = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";
const CLIENT_ID = process.env["OIDC_CLIENT_ID"] ?? "367357876898889878";
const CLIENT_SECRET = process.env["OIDC_CLIENT_SECRET"] ?? "";
const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:3000";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me-in-production";
const REDIRECT_URI = `${BASE_URL}/auth/callback`;
const POST_LOGOUT_URI = BASE_URL;

const SCOPE_STRING = [
  "openid", "profile", "email",
  "urn:zitadel:iam:org:project:roles",
  "urn:zitadel:iam:org:project:id:zitadel:aud",
].join(" ");

// ─── OIDC Discovery ─────────────────────────────────────────

interface OidcConfig {
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly userinfo_endpoint: string;
  readonly end_session_endpoint: string;
}

const isOidcConfig = (v: unknown): v is OidcConfig =>
  typeof v === "object" && v !== null &&
  "authorization_endpoint" in v && "token_endpoint" in v &&
  "userinfo_endpoint" in v && "end_session_endpoint" in v;

let cached: OidcConfig | null = null;

const discover = async (): Promise<OidcConfig> => {
  if (cached) return cached;
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  const body: unknown = await res.json();
  if (!isOidcConfig(body)) throw new Error("Invalid OIDC discovery response");
  cached = body;
  return body;
};

// ─── Cookie signing ─────────────────────────────────────────

const encoder = new TextEncoder();

const getKey = (): Promise<CryptoKey> =>
  crypto.subtle.importKey("raw", encoder.encode(SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

const signPayload = async (payload: string): Promise<string> => {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${Buffer.from(payload).toString("base64url")}.${Buffer.from(sig).toString("base64url")}`;
};

const verifySignature = async (cookie: string): Promise<string | null> => {
  const dot = cookie.indexOf(".");
  if (dot === -1) return null;
  const payloadB64 = cookie.slice(0, dot);
  const sigB64 = cookie.slice(dot + 1);
  const key = await getKey();
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const valid = await crypto.subtle.verify("HMAC", key, Buffer.from(sigB64, "base64url"), encoder.encode(payload));
  return valid ? payload : null;
};

// ─── Token exchange types ───────────────────────────────────

interface TokenResponse {
  readonly access_token: string;
  readonly id_token: string;
  readonly expires_in: number;
}

const isTokenResponse = (v: unknown): v is TokenResponse =>
  typeof v === "object" && v !== null && "access_token" in v && "id_token" in v && "expires_in" in v;

// ─── Factory ─────────────────────────────────────────────────

export const createOidcAuthService = (): AuthService => ({
  cookieName: "__session",

  cookieOptions: {
    httpOnly: true,
    secure: BASE_URL.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  },

  getSession: async (cookieValue) => {
    if (!cookieValue) return null;
    const payload = await verifySignature(cookieValue);
    if (!payload) return null;
    try {
      const parsed: unknown = JSON.parse(payload);
      if (!isSession(parsed)) return null;
      if (parsed.expiresAt < Date.now() / 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  getLoginUrl: async () => {
    const config = await discover();
    const params = new URLSearchParams({
      response_type: "code", client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI, scope: SCOPE_STRING,
    });
    return `${config.authorization_endpoint}?${params}`;
  },

  exchangeCode: async (code) => {
    const config = await discover();
    const body = new URLSearchParams({
      grant_type: "authorization_code", code,
      redirect_uri: REDIRECT_URI, client_id: CLIENT_ID,
    });
    if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);

    const tokenRes = await fetch(config.token_endpoint, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);

    const tokenData: unknown = await tokenRes.json();
    if (!isTokenResponse(tokenData)) throw new Error("Invalid token response");

    const userinfoRes = await fetch(config.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userinfoRes.ok) throw new Error(`Userinfo failed: ${userinfoRes.status}`);

    const userinfo = (await userinfoRes.json()) as {
      name?: string; email?: string;
      "urn:zitadel:iam:org:project:roles"?: Record<string, unknown>;
    };
    const roleClaim = userinfo["urn:zitadel:iam:org:project:roles"];

    const session: Session = {
      accessToken: tokenData.access_token,
      idToken: tokenData.id_token,
      name: userinfo.name ?? "",
      email: userinfo.email ?? "",
      roles: roleClaim ? Object.keys(roleClaim) : [],
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
    };

    const signedCookie = await signPayload(JSON.stringify(session));
    return { session, signedCookie };
  },

  getLogoutUrl: async (idToken) => {
    const config = await discover();
    const params = new URLSearchParams({
      id_token_hint: idToken, post_logout_redirect_uri: POST_LOGOUT_URI,
    });
    return `${config.end_session_endpoint}?${params}`;
  },
});
