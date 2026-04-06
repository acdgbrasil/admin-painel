import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { createSignal } from "solid-js";

// ─── OIDC Configuration ─────────────────────────────────────

const ISSUER = "https://auth.acdgbrasil.com.br";
const CLIENT_ID = "367357876898889878";
const REDIRECT_URI = `${window.location.origin}/callback`;
const POST_LOGOUT_URI = window.location.origin;

const userManager = new UserManager({
  authority: ISSUER,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: POST_LOGOUT_URI,
  response_type: "code",
  scope: [
    "openid",
    "profile",
    "email",
    "urn:zitadel:iam:org:project:roles",
    "urn:zitadel:iam:org:project:id:zitadel:aud",
  ].join(" "),
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
});

// ─── Reactive state ──────────────────────────────────────────

const [user, setUser] = createSignal<User | null>(null);
const [loading, setLoading] = createSignal(true);

export const authUser = user;
export const authLoading = loading;

export const isAuthenticated = () => {
  const u = user();
  return !!u && !u.expired;
};

// ─── Extract roles from Zitadel JWT ─────────────���────────────

const ROLE_CLAIM = "urn:zitadel:iam:org:project:roles";

export const userRoles = (): readonly string[] => {
  const u = user();
  if (!u?.profile) return [];
  const roles = u.profile[ROLE_CLAIM];
  if (roles && typeof roles === "object") return Object.keys(roles as Record<string, unknown>);
  return [];
};

export const hasRole = (role: string): boolean => userRoles().includes(role);

// ─── Actions ──────────────────────────────────���──────────────

export const login = () => userManager.signinRedirect();

export const logout = () =>
  userManager.signoutRedirect({ post_logout_redirect_uri: POST_LOGOUT_URI });

export const handleCallback = async (): Promise<User> => {
  const u = await userManager.signinRedirectCallback();
  setUser(u);
  return u;
};

export const restoreSession = async (): Promise<void> => {
  try {
    const u = await userManager.getUser();
    if (u && !u.expired) {
      setUser(u);
    }
  } finally {
    setLoading(false);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  const u = await userManager.getUser();
  return u?.access_token ?? null;
};

// ─── Events ──────────────────────────────────────────────────

userManager.events.addUserLoaded((u: User) => void setUser(u));
userManager.events.addUserUnloaded(() => void setUser(null));
userManager.events.addAccessTokenExpired(() => void setUser(null));
