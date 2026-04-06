// ─── ACL: Zitadel raw grant → domain UserGrant ──────────────

import type { UserGrant } from "../../data/model/grant";

export const mapZitadelGrant = (raw: Record<string, unknown>): UserGrant => ({
  id: String(raw["id"] ?? ""),
  userId: String(raw["userId"] ?? ""),
  projectId: String(raw["projectId"] ?? ""),
  projectName: String(raw["projectName"] ?? ""),
  roleKeys: Array.isArray(raw["roleKeys"]) ? (raw["roleKeys"] as string[]) : [],
});
