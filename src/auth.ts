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
].join(" ");

const COOKIE_NAME = "__session";
const COOKIE_MAX_AGE_S = 3600; // 1 hour

// ─── OIDC Discovery (lazy, cached) ──────────────────────────

type OidcConfig = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
};

let _oidcConfig: OidcConfig | null = null;

const getOidcConfig = async (): Promise<OidcConfig> => {
  if (_oidcConfig) return _oidcConfig;
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  _oidcConfig = (await res.json()) as OidcConfig;
  return _oidcConfig;
};

// ─── Cookie signing (HMAC-SHA256) ────────────────────────────

const encoder = new TextEncoder();

const getSigningKey = async () =>
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
  const parts = cookie.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts as [string, string];

  const key = await getSigningKey();
  const sig = Buffer.from(sigB64, "base64url");
  const payload = Buffer.from(payloadB64, "base64url").toString();
  const valid = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(payload));
  return valid ? payload : null;
};

// ─── Session types ───────────────────────────────────────────

export type Session = {
  accessToken: string;
  idToken: string;
  name: string;
  email: string;
  roles: string[];
  expiresAt: number;
};

// ─── Public API ──────────────────────────────────────────────

export const getSession = async (cookie: string | undefined): Promise<Session | null> => {
  if (!cookie) return null;
  const payload = await verify(cookie);
  if (!payload) return null;
  try {
    const session = JSON.parse(payload) as Session;
    if (session.expiresAt < Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
};

export const getLoginUrl = async (state?: string): Promise<string> => {
  const config = await getOidcConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    ...(state && { state }),
  });
  return `${config.authorization_endpoint}?${params}`;
};

export const exchangeCodeForSession = async (code: string): Promise<{ session: Session; cookie: string }> => {
  const config = await getOidcConfig();

  // Token exchange
  const tokenRes = await fetch(config.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      ...(CLIENT_SECRET && { client_secret: CLIENT_SECRET }),
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} ${body}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    id_token: string;
    expires_in: number;
  };

  // Userinfo
  const userinfoRes = await fetch(config.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userinfoRes.ok) throw new Error(`Userinfo failed: ${userinfoRes.status}`);

  const userinfo = (await userinfoRes.json()) as {
    name?: string;
    email?: string;
    "urn:zitadel:iam:org:project:roles"?: Record<string, unknown>;
  };

  const roleClaim = userinfo["urn:zitadel:iam:org:project:roles"];
  const roles = roleClaim ? Object.keys(roleClaim) : [];

  const session: Session = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    name: userinfo.name ?? "",
    email: userinfo.email ?? "",
    roles,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
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
  name: COOKIE_NAME,
  httpOnly: true,
  secure: BASE_URL.startsWith("https"),
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE_S,
};

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
