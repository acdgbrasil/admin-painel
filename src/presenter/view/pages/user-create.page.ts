import { authenticatedLayout } from "../templates/authenticated";
import { renderFormField } from "../molecules/form-field";
import { renderInput } from "../atoms/input";
import { renderButton } from "../atoms/button";
import { renderLink } from "../atoms/link";
import type { SessionInfo } from "../../../data/model/session";

export interface UserCreatePageState {
  readonly session: SessionInfo;
  readonly error: string | null;
  readonly submitting: boolean;
}

export const userCreatePage = (state: UserCreatePageState): string =>
  authenticatedLayout(state.session, `
    <main class="container mx-auto p-6 max-w-lg">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6">Novo Usuário</h1>

      ${state.error ? `<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">${state.error}</div>` : ""}

      <form data-action="create-user" class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          ${renderFormField({ label: "Nome", input: renderInput({ name: "firstName", required: true }) })}
          ${renderFormField({ label: "Sobrenome", input: renderInput({ name: "lastName", required: true }) })}
        </div>

        <div class="grid grid-cols-2 gap-4">
          ${renderFormField({ label: "CPF", hint: "opcional", input: renderInput({ name: "cpf", pattern: "\\\\d{11}", maxLength: 11, placeholder: "00000000000" }) })}
          ${renderFormField({ label: "Data de nascimento", input: renderInput({ name: "birthDate", type: "date", required: true }) })}
        </div>

        ${renderFormField({ label: "Email", input: renderInput({ name: "email", type: "email", required: true }) })}
        ${renderFormField({ label: "Username", hint: "opcional, default: email", input: renderInput({ name: "username", placeholder: "usuario@email.com" }) })}
        ${renderFormField({ label: "Senha inicial", hint: "opcional — Zitadel envia convite por email se vazio", input: renderInput({ name: "password", type: "password", placeholder: "Deixe vazio para convite por email" }) })}

        <div class="flex gap-3 pt-2">
          ${renderButton({ label: state.submitting ? "Criando..." : "Criar Usuário", variant: "primary", type: "submit", disabled: state.submitting })}
          ${renderLink({ href: "/users", label: "Cancelar", cls: "px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors" })}
        </div>
      </form>
    </main>
  `);
