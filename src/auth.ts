// ─── OIDC Server-Side Auth (Authorization Code Flow) ─────────
//
// Implements OIDC against Zitadel without any client library.
// Three HTTP calls: authorize redirect, token exchange, userinfo.
// Token stored in signed httpOnly cookie.

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
const COOKIE_MAX_AGE_S = 3600;

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

const getOidcConfig = async (): Promise<OidcConfig> => {
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

const sign = async (payload: string): Promise<string> => {
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = Buffer.from(sig).toString("base64url");
  const payloadB64 = Buffer.from(payload).toString("base64url");
  return `${payloadB64}.${sigB64}`;
};

const verify = async (cookie: string): Promise<string | null> => {
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

// ─── Session types ───────────────────────────────────────────

export interface Session {
  readonly accessToken: string;
  readonly idToken: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly expiresAt: number;
}

const isSession = (value: unknown): value is Session =>
  typeof value === "object" &&
  value !== null &&
  "accessToken" in value &&
  "idToken" in value &&
  "expiresAt" in value &&
  typeof (value as { expiresAt: unknown }).expiresAt === "number";

// ─── Public API ──────────────────────────────────────────────

export const getSession = async (cookie: string | undefined): Promise<Session | null> => {
  if (!cookie) return null;

  const payload = await verify(cookie);
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
  const config = await getOidcConfig();
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

export const exchangeCodeForSession = async (
  code: string,
): Promise<{ readonly session: Session; readonly cookie: string }> => {
  const config = await getOidcConfig();

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
  });
  if (CLIENT_SECRET) tokenBody.set("client_secret", CLIENT_SECRET);

  const tokenRes = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${body}`);
  }

  const tokenData: unknown = await tokenRes.json();
  if (!isTokenResponse(tokenData)) throw new Error("Invalid token response");

  const userinfoRes = await fetch(config.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userinfoRes.ok) throw new Error(`Userinfo failed: ${userinfoRes.status}`);

  const userinfo = (await userinfoRes.json()) as UserinfoResponse;
  const roleClaim = userinfo["urn:zitadel:iam:org:project:roles"];
  const roles = roleClaim ? Object.keys(roleClaim) : [];

  const session: Session = {
    accessToken: tokenData.access_token,
    idToken: tokenData.id_token,
    name: userinfo.name ?? "",
    email: userinfo.email ?? "",
    roles,
    expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
  };

  const cookie = await sign(JSON.stringify(session));
  return { session, cookie };
};

export const getLogoutUrl = async (idToken: string): Promise<string> => {
  const config = await getOidcConfig();
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: POST_LOGOUT_URI,
  });
  return `${config.end_session_endpoint}?${params}`;
};

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: BASE_URL.startsWith("https"),
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_S,
} as const;
