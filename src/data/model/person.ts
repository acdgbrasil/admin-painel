// ─── People Context types ────────────────────────────────────

export interface RegisterPersonInput {
  readonly fullName: string;
  readonly cpf?: string;
  readonly birthDate: string;
}

export interface AssignRoleInput {
  readonly system: string;
  readonly role: string;
}
