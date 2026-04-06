// ─── User Detail ViewModel ───────────────────────────────────
// Pure function: Model → ViewState for user detail + roles view.

import type { ZitadelUser, UserGrant, Project } from "../model/types";

// ─── ViewState ───────────────────────────────────────────────

interface StateBadge {
  readonly label: string;
  readonly cls: string;
}

export interface GrantRow {
  readonly id: string;
  readonly projectName: string;
  readonly roleKeys: readonly string[];
}

export interface ProjectOption {
  readonly id: string;
  readonly name: string;
}

export interface RoleOption {
  readonly key: string;
  readonly label: string;
}

export interface UserDetailViewState {
  readonly userName: string;
  readonly userRoles: string;
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly phone: string | null;
  readonly emailVerified: boolean;
  readonly creationDate: string;
  readonly badge: StateBadge;
  readonly canToggle: boolean;
  readonly toggleLabel: string;
  readonly grants: readonly GrantRow[];
  readonly hasGrants: boolean;
  readonly projects: readonly ProjectOption[];
}

// ─── State mapping ───────────────────────────────────────────

const STATE_BADGES: Readonly<Record<string, StateBadge>> = {
  USER_STATE_ACTIVE: { label: "Ativo", cls: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", cls: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", cls: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", cls: "bg-yellow-100 text-yellow-800" },
};

const DEFAULT_BADGE: StateBadge = { label: "Desconhecido", cls: "bg-gray-100" };

// ─── Transformations ─────────────────────────────────────────

const toGrantRow = (grant: UserGrant): GrantRow => ({
  id: grant.id,
  projectName: grant.projectName,
  roleKeys: grant.roleKeys,
});

export const toUserDetailViewState = (
  sessionName: string,
  sessionRoles: readonly string[],
  user: ZitadelUser,
  grants: readonly UserGrant[],
  projects: readonly Project[],
): UserDetailViewState => {
  const grantRows = grants.map(toGrantRow);
  return {
    userName: sessionName,
    userRoles: sessionRoles.join(", "),
    userId: user.userId,
    displayName: user.human?.profile.displayName ?? user.username,
    email: user.human?.email.email ?? "",
    username: user.username,
    phone: user.human?.phone?.phone ?? null,
    emailVerified: user.human?.email.isVerified ?? false,
    creationDate: new Date(user.details.creationDate).toLocaleDateString("pt-BR"),
    badge: STATE_BADGES[user.state] ?? DEFAULT_BADGE,
    canToggle: user.state === "USER_STATE_ACTIVE" || user.state === "USER_STATE_INACTIVE",
    toggleLabel: user.state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar",
    grants: grantRows,
    hasGrants: grantRows.length > 0,
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
  };
};

export const toGrantsViewState = (grants: readonly UserGrant[]): readonly GrantRow[] =>
  grants.map(toGrantRow);

export const toRoleOptions = (roles: readonly { readonly key: string; readonly displayName: string }[]): readonly RoleOption[] =>
  roles.map((r) => ({ key: r.key, label: r.displayName || r.key }));
