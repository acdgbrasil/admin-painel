import { authenticatedLayout } from "../templates/authenticated";
import { renderFormField } from "../molecules/form-field";
import { renderInput } from "../atoms/input";
import { renderLink } from "../atoms/link";
import type { SessionInfo } from "../../../data/model/session";

// ─── Field-level validation state ────────────────────────────

export interface FieldErrors {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly cpf?: string;
  readonly birthDate?: string;
  readonly email?: string;
  readonly password?: string;
}

export interface UserCreatePageState {
  readonly session: SessionInfo;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly fields: FieldErrors;
  readonly values: Readonly<Record<string, string>>;
  readonly step: number;
}

export const userCreatePage = (state: UserCreatePageState): string =>
  authenticatedLayout(state.session, `
    <main class="container mx-auto p-6 max-w-xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Cadastrar Novo Usuário</h1>
        <p class="text-gray-500 mt-2 text-base">Preencha os dados abaixo. Campos com <span class="text-red-500">*</span> são obrigatórios.</p>
      </div>

      ${state.error ? `
        <div class="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-base" role="alert">
          <p class="font-medium">Não foi possível criar o usuário</p>
          <p class="mt-1 text-sm">${state.error}</p>
        </div>` : ""}

      <form data-action="create-user" class="space-y-8" novalidate>

        <!-- Seção 1: Dados Pessoais -->
        <section class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 class="text-lg font-semibold text-gray-700 border-b pb-3">👤 Dados Pessoais</h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            ${renderFormField({
              label: "Nome",
              required: true,
              helper: "Primeiro nome da pessoa",
              error: state.fields.firstName,
              input: renderInput({
                name: "firstName",
                required: true,
                placeholder: "Ex: Maria",
                value: state.values["firstName"] ?? "",
                hasError: !!state.fields.firstName,
                autocomplete: "given-name",
              }),
            })}

            ${renderFormField({
              label: "Sobrenome",
              required: true,
              helper: "Sobrenome completo",
              error: state.fields.lastName,
              input: renderInput({
                name: "lastName",
                required: true,
                placeholder: "Ex: da Silva",
                value: state.values["lastName"] ?? "",
                hasError: !!state.fields.lastName,
                autocomplete: "family-name",
              }),
            })}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            ${renderFormField({
              label: "CPF",
              hint: "opcional",
              helper: "Digite apenas os 11 números, a máscara é automática",
              error: state.fields.cpf,
              input: renderInput({
                name: "cpf",
                id: "cpf-input",
                placeholder: "000.000.000-00",
                value: state.values["cpf"] ?? "",
                hasError: !!state.fields.cpf,
                maxLength: 14,
                inputMode: "numeric",
                autocomplete: "off",
              }),
            })}

            ${renderFormField({
              label: "Data de Nascimento",
              required: true,
              helper: "Selecione no calendário ou digite no formato DD/MM/AAAA",
              error: state.fields.birthDate,
              input: renderInput({
                name: "birthDate",
                type: "date",
                required: true,
                value: state.values["birthDate"] ?? "",
                hasError: !!state.fields.birthDate,
              }),
            })}
          </div>
        </section>

        <!-- Seção 2: Acesso -->
        <section class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 class="text-lg font-semibold text-gray-700 border-b pb-3">🔐 Dados de Acesso</h2>

          ${renderFormField({
            label: "Email",
            required: true,
            helper: "Este será o email principal para login e comunicações",
            error: state.fields.email,
            input: renderInput({
              name: "email",
              type: "email",
              required: true,
              placeholder: "exemplo@email.com",
              value: state.values["email"] ?? "",
              hasError: !!state.fields.email,
              autocomplete: "email",
            }),
          })}

          ${renderFormField({
            label: "Nome de Usuário",
            hint: "opcional",
            helper: "Se não preencher, o email será usado como nome de usuário",
            input: renderInput({
              name: "username",
              placeholder: "Deixe em branco para usar o email",
              value: state.values["username"] ?? "",
              autocomplete: "username",
            }),
          })}

          ${renderFormField({
            label: "Senha Inicial",
            hint: "opcional",
            helper: "Se não preencher, o sistema enviará um convite por email para o usuário criar a própria senha",
            error: state.fields.password,
            input: renderInput({
              name: "password",
              type: "password",
              placeholder: "Mínimo 8 caracteres",
              value: state.values["password"] ?? "",
              hasError: !!state.fields.password,
              autocomplete: "new-password",
            }),
          })}
        </section>

        <!-- Ações -->
        <div class="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="submit" data-action="create-user"
            class="flex-1 px-6 py-4 text-lg font-semibold rounded-xl transition-colors
              ${state.submitting
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-sky-700 text-white hover:bg-sky-800 active:bg-sky-900"}"
            ${state.submitting ? "disabled" : ""}>
            ${state.submitting ? "⏳ Criando conta..." : "✅ Criar Conta"}
          </button>
          ${renderLink({
            href: "/users",
            label: "← Voltar",
            cls: "text-center px-6 py-4 text-lg font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-700",
          })}
        </div>
      </form>
    </main>
  `);
