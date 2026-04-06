import { esc } from "../esc";
import type { ProjectOption, RoleOption } from "./UserDetailPage";

// ─── Types ───────────────────────────────────────────────────

export interface WizardState {
  readonly step: number;
  readonly fields: Readonly<Record<string, string>>;
  readonly errors: Readonly<Record<string, string>>;
  readonly projects: readonly ProjectOption[];
  readonly roles: readonly RoleOption[];
  readonly selectedProject: string;
  readonly selectedRoles: readonly string[];
  readonly submitting: boolean;
  readonly serverError: string | null;
}

// ─── Step indicator ──────────────────────────────────────────

const StepDots = (p: { current: number }): string => (
  <div class="flex items-center justify-center gap-0 mb-8">
    {[0, 1, 2].map((i) => {
      const isDone = i < p.current;
      const isCurrent = i === p.current;
      const dotStyle = isCurrent
        ? "background:#261D11;transform:scale(1.3);"
        : isDone
          ? "background:#4F8448;"
          : "background:rgba(38,29,17,0.2);";
      return `
        ${i > 0 ? `<div class="w-8 h-[2px]" style="background:rgba(38,29,17,0.15);"></div>` : ""}
        <div class="w-2.5 h-2.5 rounded-full transition-all duration-300" style="${dotStyle}"></div>
      `;
    }).join("") as "safe"}
  </div>
) as unknown as string;

// ─── Input field ─────────────────────────────────────────────

const Field = (p: {
  label: string; name: string; required?: boolean; hint?: string; helper?: string;
  type?: string; placeholder?: string; value?: string; error?: string;
  inputMode?: string; maxLength?: number; id?: string;
}): string => (
  <div class="space-y-1">
    <label class="block text-base font-medium" style="color:#261D11;">
      {p.label as "safe"}
      {p.required ? <span style="color:#A6290D;" class="ml-0.5">*</span> : ""}
      {p.hint ? <span class="text-sm font-normal ml-1" style="color:rgba(38,29,17,0.4);">({p.hint as "safe"})</span> : ""}
    </label>
    {p.helper ? <p class="text-sm" style="color:rgba(38,29,17,0.5);">{p.helper as "safe"}</p> : ""}
    <input
      type={p.type ?? "text"}
      name={p.name}
      id={p.id}
      placeholder={p.placeholder}
      value={p.value ?? ""}
      inputmode={p.inputMode}
      maxlength={p.maxLength}
      required={p.required}
      class={`w-full py-3 text-base font-editorial italic font-light transition-colors ${p.error ? "shake" : ""}`}
      style={`border:none;border-bottom:1.5px solid ${p.error ? "#A6290D" : "rgba(38,29,17,0.2)"};background:transparent;color:#261D11;outline:none;`}
    />
    {p.error ? <p class="text-xs mt-1" style="color:#A6290D;" role="alert">{p.error as "safe"}</p> : ""}
  </div>
) as unknown as string;

// ─── Steps ───────────────────────────────────────────────────

const Step0 = (s: WizardState): string => (
  <div class="space-y-5">
    <div class="grid grid-cols-2 gap-5">
      {Field({ label: "Nome", name: "firstName", required: true, placeholder: "Ex: Maria", value: s.fields["firstName"], error: s.errors["firstName"] })}
      {Field({ label: "Sobrenome", name: "lastName", required: true, placeholder: "Ex: da Silva", value: s.fields["lastName"], error: s.errors["lastName"] })}
    </div>
    <div class="grid grid-cols-2 gap-5">
      {Field({ label: "CPF", name: "cpf", required: true, id: "cpf-input", placeholder: "000.000.000-00", value: s.fields["cpf"], error: s.errors["cpf"], inputMode: "numeric", maxLength: 14, helper: "A máscara é automática" })}
      {Field({ label: "Data de nascimento", name: "birthDate", type: "date", required: true, value: s.fields["birthDate"], error: s.errors["birthDate"] })}
    </div>
  </div>
) as unknown as string;

const Step1 = (s: WizardState): string => (
  <div class="space-y-5">
    {Field({ label: "E-mail", name: "email", type: "email", required: true, placeholder: "exemplo@email.com", value: s.fields["email"], error: s.errors["email"] })}
    {Field({ label: "Username", name: "username", hint: "opcional", placeholder: "Se vazio, gerado automaticamente", value: s.fields["username"] })}
    {Field({ label: "Senha inicial", name: "password", type: "password", hint: "opcional", placeholder: "Se vazio, um convite será enviado por e-mail", value: s.fields["password"], error: s.errors["password"], helper: "Mínimo 8 caracteres" })}
  </div>
) as unknown as string;

const Step2 = (s: WizardState): string => (
  <div class="space-y-5">
    <div>
      <label class="block text-base font-medium mb-2" style="color:#261D11;">Projeto</label>
      <select name="projectId" data-action="select-project" class="w-full py-3 text-base font-editorial italic font-light"
        style="border:none;border-bottom:1.5px solid rgba(38,29,17,0.2);background:transparent;color:#261D11;outline:none;">
        <option value="">Selecione um projeto...</option>
        {s.projects.map((p) => `<option value="${esc(p.id)}" ${p.id === s.selectedProject ? "selected" : ""}>${esc(p.name)}</option>`).join("") as "safe"}
      </select>
    </div>

    {s.roles.length > 0 ? (
      <div>
        <label class="block text-base font-medium mb-3" style="color:#261D11;">Roles</label>
        <div class="flex flex-wrap gap-2">
          {s.roles.map((r) => {
            const selected = s.selectedRoles.includes(r.key);
            return `<label class="cursor-pointer">
              <input type="checkbox" name="roleKeys" value="${esc(r.key)}" ${selected ? "checked" : ""} class="hidden peer" />
              <span class="inline-block px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors peer-checked:text-white" style="background:${selected ? "#4F8448" : "rgba(38,29,17,0.07)"};color:${selected ? "white" : "#261D11"};">${esc(r.label)}</span>
            </label>`;
          }).join("") as "safe"}
        </div>
      </div>
    ) : s.selectedProject ? (
      <p class="text-sm font-editorial italic" style="color:rgba(38,29,17,0.4);">Este projeto ainda não tem roles definidas</p>
    ) : ""}

    <p class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.4);">
      Mais permissões podem ser adicionadas depois no detalhe do usuário.
    </p>
  </div>
) as unknown as string;

// ─── Wizard modal content ────────────────────────────────────

const STEP_TITLES = ["Dados pessoais", "Dados de acesso", "Permissões iniciais"] as const;
const STEP_SUBTITLES = [
  "Informações básicas da pessoa",
  "Como o usuário vai acessar o sistema",
  "Opcional — pode ser configurado depois",
] as const;

export const CreateUserWizard = (state: WizardState): string => (
  <div class="p-8">
    {/* Header */}
    <div class="flex items-start justify-between mb-2">
      <div>
        <h2 class="text-xl font-bold" style="color:#261D11;">Criar Usuário</h2>
        <p class="text-sm font-editorial italic mt-1" style="color:rgba(38,29,17,0.5);">
          {STEP_SUBTITLES[state.step] as "safe"}
        </p>
      </div>
      <button data-action="close-modal" class="w-8 h-8 rounded-full flex items-center justify-center" style="color:rgba(38,29,17,0.4);">✕</button>
    </div>

    {StepDots({ current: state.step })}

    {state.serverError ? (
      <div class="mb-4 p-3 rounded-xl text-sm" style="background:rgba(166,41,13,0.08);color:#A6290D;">
        {state.serverError as "safe"}
      </div>
    ) : ""}

    {/* Step content */}
    <form data-action="wizard-submit">
      {state.step === 0 ? Step0(state) : state.step === 1 ? Step1(state) : Step2(state)}

      {/* Footer */}
      <div class="flex justify-between mt-8 pt-6" style="border-top:1px solid rgba(38,29,17,0.08);">
        {state.step > 0 ? (
          <button type="button" data-action="wizard-back" class="px-5 py-2.5 rounded-full text-sm font-medium" style="border:1.5px solid rgba(38,29,17,0.2);color:#261D11;">
            Voltar
          </button>
        ) : <div></div>}

        {state.step < 2 ? (
          <button type="button" data-action="wizard-next" class="px-6 py-2.5 rounded-full text-sm font-medium font-editorial italic text-white" style="background:#4F8448;">
            Próximo
          </button>
        ) : (
          <button type="submit" class="px-6 py-2.5 rounded-full text-sm font-medium font-editorial italic text-white" style={`background:${state.submitting ? "rgba(38,29,17,0.3)" : "#4F8448"};`} disabled={state.submitting}>
            {state.submitting ? "Aguarde..." : "Criar usuário ✓"}
          </button>
        )}
      </div>
    </form>
  </div>
) as unknown as string;
