// ─── User Form ViewModel ─────────────────────────────────────
// Parses and validates form body for user creation.

import type { CreateUserInput } from "../model/types";

// ─── Form parsing (unknown → typed) ─────────────────────────

const field = (body: unknown, key: string): string => {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

export const fieldArray = (body: unknown, key: string): readonly string[] => {
  if (typeof body !== "object" || body === null) return [];
  const value = (body as Record<string, unknown>)[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
};

export const parseCreateUserForm = (body: unknown): CreateUserInput => ({
  username: field(body, "username"),
  firstName: field(body, "firstName"),
  lastName: field(body, "lastName"),
  email: field(body, "email"),
  password: field(body, "password") || undefined,
});

export const parseGrantForm = (body: unknown): { readonly projectId: string; readonly roleKeys: readonly string[] } => ({
  projectId: field(body, "projectId"),
  roleKeys: fieldArray(body, "roleKeys"),
});
