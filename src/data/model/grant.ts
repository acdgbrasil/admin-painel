// ─── Grants, Projects, Roles ─────────────────────────────────

export interface UserGrant {
  readonly id: string;
  readonly userId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly roleKeys: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly name: string;
}

export interface ProjectRole {
  readonly key: string;
  readonly displayName: string;
}
