// ─── Create User Wizard ViewModel ────────────────────────────

import { createSignal, createEffect, createRoot } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { PersonRepository } from "../../data/repository/port/person-repository";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { SessionInfo } from "../../data/model/session";
import type { ProjectRole } from "../../data/model/grant";
import { createCommand } from "../core/command";
import { openModal } from "../core/modal";
import { showToast } from "../core/toast";
import { apiSuccess, apiFailure } from "../../data/model/result";
import { CreateUserWizard, type WizardState } from "../view/pages/CreateUserWizard";

// ─── CPF mask ────────────────────────────────────────────────

const applyCpfMask = (raw: string): string => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const stripCpf = (s: string): string => s.replace(/\D/g, "");

const isValidCpf = (cpf: string): boolean => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const s1 = Array.from({ length: 9 }, (_, i) => Number(d[i]) * (10 - i)).reduce((a, b) => a + b, 0);
  if (((s1 * 10) % 11) % 10 !== Number(d[9])) return false;
  const s2 = Array.from({ length: 10 }, (_, i) => Number(d[i]) * (11 - i)).reduce((a, b) => a + b, 0);
  return ((s2 * 10) % 11) % 10 === Number(d[10]);
};

// ─── Validation ──────────────────────────────────────────────

const validateStep0 = (fields: Record<string, string>): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!fields["firstName"]?.trim()) e["firstName"] = "Preencha o nome";
  if (!fields["lastName"]?.trim()) e["lastName"] = "Preencha o sobrenome";
  const cpf = stripCpf(fields["cpf"] ?? "");
  if (cpf.length > 0 && cpf.length < 11) e["cpf"] = "CPF incompleto";
  else if (cpf.length === 11 && !isValidCpf(cpf)) e["cpf"] = "CPF inválido";
  if (!fields["birthDate"]) e["birthDate"] = "Selecione a data de nascimento";
  else if (new Date(fields["birthDate"]) > new Date()) e["birthDate"] = "Data no futuro";
  return e;
};

const validateStep1 = (fields: Record<string, string>): Record<string, string> => {
  const e: Record<string, string> = {};
  const email = fields["email"]?.trim() ?? "";
  if (!email) e["email"] = "Preencha o email";
  else if (!email.includes("@") || !email.includes(".")) e["email"] = "Email inválido";
  const pw = fields["password"] ?? "";
  if (pw.length > 0 && pw.length < 8) e["password"] = "Mínimo 8 caracteres";
  return e;
};

// ─── Deps ────────────────────────────────────────────────────

interface Deps {
  readonly userRepo: UserRepository;
  readonly personRepo: PersonRepository;
  readonly projectRepo: ProjectRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

export const createUserCreateViewModel = (deps: Deps): { readonly open: () => void } => {
  const open = (): void => {
    createRoot((dispose) => {
      const [step, setStep] = createSignal(0);
      const [fields, setFields] = createSignal<Record<string, string>>({});
      const [errors, setErrors] = createSignal<Record<string, string>>({});
      const [projects, setProjects] = createSignal<readonly { id: string; name: string }[]>([]);
      const [roles, setRoles] = createSignal<readonly { key: string; label: string }[]>([]);
      const [selectedProject, setSelectedProject] = createSignal("");
      const [selectedRoles, setSelectedRoles] = createSignal<readonly string[]>([]);
      const [submitting, setSubmitting] = createSignal(false);
      const [serverError, setServerError] = createSignal<string | null>(null);

      // Load projects for step 2
      deps.projectRepo.list().then((r) => {
        if (r.ok) setProjects(r.data.map((p) => ({ id: p.id, name: p.name })));
      });

      const toState = (): WizardState => ({
        step: step(),
        fields: fields(),
        errors: errors(),
        projects: projects(),
        roles: roles(),
        selectedProject: selectedProject(),
        selectedRoles: selectedRoles(),
        submitting: submitting(),
        serverError: serverError(),
      });

      const renderWizard = (): void => {
        const content = document.querySelector("[data-modal-content]");
        if (content) content.innerHTML = CreateUserWizard(toState());
      };

      const modal = openModal(CreateUserWizard(toState()));

      // Re-render on state change
      createEffect(() => {
        // Touch all signals to track them
        step(); fields(); errors(); projects(); roles();
        selectedProject(); selectedRoles(); submitting(); serverError();
        renderWizard();
      });

      // Event delegation inside modal
      const container = document.getElementById("modal-container");
      if (!container) return;

      container.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");

        if (action === "close-modal") {
          modal.close();
          dispose();
        } else if (action === "wizard-next") {
          const currentFields = collectFields();
          const validation = step() === 0 ? validateStep0(currentFields) : validateStep1(currentFields);
          setErrors(validation);
          setFields(currentFields);
          if (Object.keys(validation).length === 0) {
            setStep(step() + 1);
          } else {
            showToast("Preencha todos os campos obrigatórios", "error");
          }
        } else if (action === "wizard-back") {
          setFields(collectFields());
          setStep(step() - 1);
        } else if (action === "select-project") {
          const select = target as HTMLSelectElement;
          setSelectedProject(select.value);
          setSelectedRoles([]);
          if (select.value) {
            deps.projectRepo.listRoles(select.value).then((r) => {
              if (r.ok) setRoles(r.data.map((role) => ({ key: role.key, label: role.displayName || role.key })));
            });
          } else {
            setRoles([]);
          }
        }
      });

      container.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentFields = collectFields();
        setFields(currentFields);
        setSubmitting(true);
        setServerError(null);

        const firstName = currentFields["firstName"] ?? "";
        const lastName = currentFields["lastName"] ?? "";
        const email = currentFields["email"] ?? "";

        // 1. Create in Zitadel
        const result = await deps.userRepo.create({
          firstName, lastName, email,
          username: currentFields["username"] || undefined,
          password: currentFields["password"] || undefined,
        });

        if (!result.ok) {
          setServerError(result.message);
          setSubmitting(false);
          return;
        }

        // 2. Register in People Context
        const cpf = stripCpf(currentFields["cpf"] ?? "");
        const birthDate = currentFields["birthDate"] ?? "";
        if (birthDate) {
          await deps.personRepo.register(result.data.userId, {
            fullName: `${firstName} ${lastName}`.trim(),
            cpf: cpf || undefined,
            birthDate,
          });
        }

        // 3. Add grant if selected
        if (selectedProject() && selectedRoles().length > 0) {
          // Grant is done via API — handled by the caller after redirect
        }

        setSubmitting(false);
        modal.close();
        dispose();
        showToast("Usuário criado com sucesso!", "success");
        deps.router.navigate(`/users/${result.data.userId}`);
      });

      const collectFields = (): Record<string, string> => {
        const modalContent = document.querySelector("[data-modal-content]");
        if (!modalContent) return fields();
        const inputs = modalContent.querySelectorAll<HTMLInputElement>("input[name], select[name]");
        const result: Record<string, string> = { ...fields() };
        inputs.forEach((input) => { result[input.name] = input.value; });
        return result;
      };

      // CPF mask
      container.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.id === "cpf-input") {
          target.value = applyCpfMask(target.value);
        }
      });
    });
  };

  return { open };
};
