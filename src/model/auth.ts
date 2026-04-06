// ─── OIDC Server-Side Auth (Authorization Code Flow) ─────────

import type { Session } from "./types";
import { isSession } from "./types";

// ─── Config ──────────────────────────────────────────────────

const ISSUER = process.env["OIDC_ISSUER"] ?? "https://auth.acdgbrasil.com.br";
const CLIENT_ID = process.env["OIDC_CLIENT_ID"] ?? "367357876898889878";
const CLIENT_SECRET = process.env["OIDC_CLIENT_SECRET"] ?? "";
const BASE_URL = process.env["BASE_URL"] ?? "http://localhost:3000";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me-in-production";
const REDIRECT_URI = `${BASE_URL}/auth/callback`;
const POST_LOGOUT_URI = BASE_URL;

const SCOPES = [
  "openid",
  "profile",
  "email",
  "urn:zitadel:iam:org:project:roles",
  "urn:zitadel:iam:org:project:id:zitadel:aud",
] as const;

const SCOPE_STRING = SCOPES.join(" ");

export const COOKIE_NAME = "__session";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: BASE_URL.startsWith("https"),
  sameSite: "lax" as const,
  path: "/",
  maxAge: 3600,
} as const;

// ─── OIDC Discovery (lazy, cached) ──────────────────────────

interface OidcConfig {
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly userinfo_endpoint: string;
  readonly end_session_endpoint: string;
}

const isOidcConfig = (value: unknown): value is OidcConfig =>
  typeof value === "object" &&
  value !== null &&
  "authorization_endpoint" in value &&
  "token_endpoint" in value &&
  "userinfo_endpoint" in value &&
  "end_session_endpoint" in value;

let cachedOidcConfig: OidcConfig | null = null;

const discoverOidc = async (): Promise<OidcConfig> => {
  if (cachedOidcConfig) return cachedOidcConfig;
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  const body: unknown = await res.json();
  if (!isOidcConfig(body)) throw new Error("Invalid OIDC discovery response");
  cachedOidcConfig = body;
  return body;
};

// ─── Cookie signing (HMAC-SHA256) ────────────────────────────

const encoder = new TextEncoder();

const getSigningKey = (): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const signPayload = async (payload: string): Promise<string> => {
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = Buffer.from(sig).toString("base64url");
  const payloadB64 = Buffer.from(payload).toString("base64url");
  return `${payloadB64}.${sigB64}`;
};

const verifySignature = async (cookie: string): Promise<string | null> => {
  const dotIndex = cookie.indexOf(".");
  if (dotIndex === -1) return null;
  const payloadB64 = cookie.slice(0, dotIndex);
  const sigB64 = cookie.slice(dotIndex + 1);
  const key = await getSigningKey();
  const sig = Buffer.from(sigB64, "base64url");
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const valid = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(payload));
  return valid ? payload : null;
};

// ─── Public API ──────────────────────────────────────────────

export const getSession = async (cookieValue: string | undefined): Promise<Session | null> => {
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
};

export const getLoginUrl = async (): Promise<string> => {
  const config = await discoverOidc();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE_STRING,
  });
  return `${config.authorization_endpoint}?${params}`;
};

interface TokenResponse {
  readonly access_token: string;
  readonly id_token: string;
  readonly expires_in: number;
}

const isTokenResponse = (value: unknown): value is TokenResponse =>
  typeof value === "object" &&
  value !== null &&
  "access_token" in value &&
  "id_token" in value &&
  "expires_in" in value;

interface UserinfoResponse {
  readonly name?: string;
  readonly email?: string;
  readonly "urn:zitadel:iam:org:project:roles"?: Record<string, unknown>;
}

export const exchangeCode = async (
  code: string,
): Promise<{ readonly session: Session; readonly signedCookie: string }> => {
  const config = await discoverOidc();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
  });
  if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);

  const tokenRes = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${text}`);
  }

  const tokenData: unknown = await tokenRes.json();
  if (!isTokenResponse(tokenData)) throw new Error("Invalid token response");

  const userinfoRes = await fetch(config.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userinfoRes.ok) throw new Error(`Userinfo failed: ${userinfoRes.status}`);

  const userinfo = (await userinfoRes.json()) as UserinfoResponse;
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
};

export const getLogoutUrl = async (idToken: string): Promise<string> => {
  const config = await discoverOidc();
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: POST_LOGOUT_URI,
  });
  return `${config.end_session_endpoint}?${params}`;
};
