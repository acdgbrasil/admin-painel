// ─── ACL: Form input → People Context API input ─────────────

import type { RegisterPersonInput } from "../../data/model/person";

export interface CreateUserFormData {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username?: string;
  readonly password?: string;
  readonly cpf?: string;
  readonly birthDate?: string;
}

export const toRegisterPersonInput = (form: CreateUserFormData): RegisterPersonInput | null => {
  if (!form.birthDate) return null;
  return {
    fullName: `${form.firstName} ${form.lastName}`.trim(),
    cpf: form.cpf || undefined,
    birthDate: form.birthDate,
  };
};
