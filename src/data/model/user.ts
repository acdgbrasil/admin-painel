// ─── Domain User (stable internal shape) ─────────────────────

export type UserState = "active" | "inactive" | "locked" | "initial" | "unknown";

export interface User {
  readonly id: string;
  readonly state: UserState;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly phone: string | null;
  readonly createdAt: string;
}

export interface CreateUserInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username?: string;
  readonly password?: string;
}

// ─── View-ready derivatives ──────────────────────────────────

export interface StateBadge {
  readonly label: string;
  readonly cls: string;
}

export const STATE_BADGES: Readonly<Record<UserState, StateBadge>> = {
  active: { label: "Ativo", cls: "bg-green-100 text-green-800" },
  inactive: { label: "Inativo", cls: "bg-gray-100 text-gray-600" },
  locked: { label: "Bloqueado", cls: "bg-red-100 text-red-800" },
  initial: { label: "Inicial", cls: "bg-yellow-100 text-yellow-800" },
  unknown: { label: "Desconhecido", cls: "bg-gray-100 text-gray-600" },
};
