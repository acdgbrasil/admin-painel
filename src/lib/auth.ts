import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { createSignal, isServer } from "solid-js";

// ─── OIDC Configuration ─────────────────────────────────────

const ISSUER = "https://auth.acdgbrasil.com.br";
const CLIENT_ID = "367357876898889878";

let userManager: UserManager;

function getUserManager(): UserManager {
  if (!userManager) {
    userManager = new UserManager({
      authority: ISSUER,
      client_id: CLIENT_ID,
      redirect_uri: `${window.location.origin}/callback`,
      post_logout_redirect_uri: window.location.origin,
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

    userManager.events.addUserLoaded((u: User) => void setUser(u));
    userManager.events.addUserUnloaded(() => void setUser(null));
    userManager.events.addAccessTokenExpired(() => void setUser(null));
  }
  return userManager;
}

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

export const login = () => getUserManager().signinRedirect();

export const logout = () =>
  getUserManager().signoutRedirect({ post_logout_redirect_uri: window.location.origin });

export const handleCallback = async (): Promise<User> => {
  const u = await getUserManager().signinRedirectCallback();
  setUser(u);
  return u;
};

export const restoreSession = async (): Promise<void> => {
  try {
    const u = await getUserManager().getUser();
    if (u && !u.expired) {
      setUser(u);
    }
  } finally {
    setLoading(false);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  const u = await getUserManager().getUser();
  return u?.access_token ?? null;
};
