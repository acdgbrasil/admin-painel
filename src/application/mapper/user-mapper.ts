// ─── ACL: Zitadel raw response → domain User ────────────────

import type { User, UserState } from "../../data/model/user";

const STATE_MAP: Readonly<Record<string, UserState>> = {
  USER_STATE_ACTIVE: "active",
  USER_STATE_INACTIVE: "inactive",
  USER_STATE_LOCKED: "locked",
  USER_STATE_INITIAL: "initial",
};

const mapUserState = (raw: string): UserState => STATE_MAP[raw] ?? "unknown";

export const mapZitadelUser = (raw: Record<string, unknown>): User => {
  const human = raw["human"] as { profile?: Record<string, string>; email?: Record<string, unknown>; phone?: Record<string, unknown> } | undefined;
  const details = raw["details"] as Record<string, string> | undefined;

  return {
    id: String(raw["userId"] ?? ""),
    state: mapUserState(String(raw["state"] ?? "")),
    username: String(raw["username"] ?? ""),
    displayName: human?.profile?.["displayName"] ?? String(raw["username"] ?? ""),
    email: String(human?.email?.["email"] ?? ""),
    emailVerified: Boolean(human?.email?.["isVerified"]),
    phone: human?.phone?.["phone"] ? String(human.phone["phone"]) : null,
    createdAt: String(details?.["creationDate"] ?? ""),
  };
};
