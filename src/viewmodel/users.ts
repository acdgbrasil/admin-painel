// ─── Users List ViewModel ────────────────────────────────────
// Pure function: Model → ViewState for the users list view.

import type { ZitadelUser } from "../model/types";

// ─── ViewState ───────────────────────────────────────────────

interface StateBadge {
  readonly label: string;
  readonly cls: string;
}

export interface UserRow {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly state: string;
  readonly badge: StateBadge;
  readonly canToggle: boolean;
  readonly toggleLabel: string;
}

export interface UsersListViewState {
  readonly userName: string;
  readonly userRoles: string;
  readonly users: readonly UserRow[];
  readonly search: string;
  readonly isEmpty: boolean;
}

// ─── State mapping ───────────────────────────────────────────

const STATE_BADGES: Readonly<Record<string, StateBadge>> = {
  USER_STATE_ACTIVE: { label: "Ativo", cls: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", cls: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", cls: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", cls: "bg-yellow-100 text-yellow-800" },
};

const DEFAULT_BADGE: StateBadge = { label: "Desconhecido", cls: "bg-gray-100 text-gray-600" };

// ─── Transformations ─────────────────────────────────────────

export const toUserRow = (user: ZitadelUser): UserRow => ({
  userId: user.userId,
  displayName: user.human?.profile.displayName ?? user.username,
  email: user.human?.email.email ?? "—",
  username: user.username,
  state: user.state,
  badge: STATE_BADGES[user.state] ?? DEFAULT_BADGE,
  canToggle: user.state === "USER_STATE_ACTIVE" || user.state === "USER_STATE_INACTIVE",
  toggleLabel: user.state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar",
});

export const toUsersListViewState = (
  sessionName: string,
  sessionRoles: readonly string[],
  users: readonly ZitadelUser[],
  search?: string,
): UsersListViewState => ({
  userName: sessionName,
  userRoles: sessionRoles.join(", "),
  users: users.map(toUserRow),
  search: search ?? "",
  isEmpty: users.length === 0,
});
