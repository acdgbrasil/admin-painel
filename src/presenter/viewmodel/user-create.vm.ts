import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { PersonRepository } from "../../data/repository/port/person-repository";
import type { SessionInfo } from "../../data/model/session";
import { createSignal, createEffect } from "../core/reactive";
import { createRenderContext, formToObject } from "../core/render";
import { userCreatePage, type FieldErrors } from "../view/pages/user-create.page";

interface Deps {
  readonly userRepo: UserRepository;
  readonly personRepo: PersonRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

// ─── CPF mask: 000.000.000-00 ────────────────────────────────

const applyCpfMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const stripCpfMask = (masked: string): string => masked.replace(/\D/g, "");

// ─── CPF check digits validation ─────────────────────────────

const isValidCpf = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const sum1 = Array.from({ length: 9 }, (_, i) => Number(digits[i]) * (10 - i)).reduce((a, b) => a + b, 0);
  const d1 = ((sum1 * 10) % 11) % 10;
  if (d1 !== Number(digits[9])) return false;

  const sum2 = Array.from({ length: 10 }, (_, i) => Number(digits[i]) * (11 - i)).reduce((a, b) => a + b, 0);
  const d2 = ((sum2 * 10) % 11) % 10;
  return d2 === Number(digits[10]);
};

// ─── Validation ──────────────────────────────────────────────

const validate = (values: Readonly<Record<string, string>>): FieldErrors => {
  const errors: Record<string, string> = {};

  if (!values["firstName"]?.trim()) {
    errors["firstName"] = "Por favor, preencha o nome";
  }

  if (!values["lastName"]?.trim()) {
    errors["lastName"] = "Por favor, preencha o sobrenome";
  }

  const cpfRaw = stripCpfMask(values["cpf"] ?? "");
  if (cpfRaw.length > 0 && cpfRaw.length < 11) {
    errors["cpf"] = "O CPF precisa ter 11 números";
  } else if (cpfRaw.length === 11 && !isValidCpf(cpfRaw)) {
    errors["cpf"] = "Este CPF não é válido. Verifique os números digitados";
  }

  if (!values["birthDate"]) {
    errors["birthDate"] = "Por favor, selecione a data de nascimento";
  } else {
    const date = new Date(values["birthDate"]);
    if (date > new Date()) {
      errors["birthDate"] = "A data de nascimento não pode ser no futuro";
    }
    if (date.getFullYear() < 1900) {
      errors["birthDate"] = "Verifique o ano de nascimento";
    }
  }

  const email = values["email"]?.trim() ?? "";
  if (!email) {
    errors["email"] = "Por favor, preencha o email";
  } else if (!email.includes("@") || !email.includes(".")) {
    errors["email"] = "Digite um email válido, por exemplo: nome@email.com";
  }

  const password = values["password"] ?? "";
  if (password.length > 0 && password.length < 8) {
    errors["password"] = "A senha precisa ter pelo menos 8 caracteres";
  }

  return errors;
};

const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some((v) => v !== undefined);

// ─── ViewModel ───────────────────────────────────────────────

export const createUserCreateViewModel = (deps: Deps): ViewModel => {
  const error = createSignal<string | null>(null);
  const submitting = createSignal(false);
  const fields = createSignal<FieldErrors>({});
  const values = createSignal<Readonly<Record<string, string>>>({});
  const cleanups: (() => void)[] = [];

  return {
    mount: (root) => {
      const ctx = createRenderContext(root);

      cleanups.push(createEffect(() => {
        ctx.update(userCreatePage({
          session: deps.session,
          error: error.get(),
          submitting: submitting.get(),
          fields: fields.get(),
          values: values.get(),
          step: 1,
        }));
      }));

      // CPF mask: listen for input on cpf field
      root.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.name === "cpf") {
          const masked = applyCpfMask(target.value);
          target.value = masked;

          // Live validate CPF
          const digits = stripCpfMask(masked);
          const current = fields.get();
          if (digits.length === 11 && !isValidCpf(digits)) {
            fields.set({ ...current, cpf: "Este CPF não é válido. Verifique os números digitados" });
          } else if (digits.length > 0 && digits.length < 11) {
            fields.set({ ...current, cpf: undefined });
          } else if (digits.length === 11) {
            fields.set({ ...current, cpf: undefined });
          } else {
            fields.set({ ...current, cpf: undefined });
          }
        }
      });

      // Clear field errors on focus
      root.addEventListener("focusin", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.name) {
          const current = fields.get();
          if ((current as Record<string, unknown>)[target.name]) {
            fields.set({ ...current, [target.name]: undefined });
          }
        }
      });

      ctx.onSubmit(async (form, action) => {
        if (action !== "create-user") return;

        // Collect form values
        const data = formToObject(form);
        const formValues: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          formValues[k] = typeof v === "string" ? v : "";
        }
        values.set(formValues);

        // Validate
        const validationErrors = validate(formValues);
        fields.set(validationErrors);

        if (hasErrors(validationErrors)) {
          error.set(null);
          // Scroll to first error
          const firstError = root.querySelector("[role=alert]");
          firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        submitting.set(true);
        error.set(null);

        const firstName = formValues["firstName"] ?? "";
        const lastName = formValues["lastName"] ?? "";
        const email = formValues["email"] ?? "";
        const username = formValues["username"] ?? "";
        const password = formValues["password"] ?? "";
        const cpf = stripCpfMask(formValues["cpf"] ?? "");
        const birthDate = formValues["birthDate"] ?? "";

        // 1. Create in Zitadel
        const result = await deps.userRepo.create({
          firstName,
          lastName,
          email,
          username: username || undefined,
          password: password || undefined,
        });

        if (!result.ok) {
          error.set(result.message);
          submitting.set(false);
          root.querySelector("main")?.scrollIntoView({ behavior: "smooth" });
          return;
        }

        // 2. Register in People Context (best-effort)
        if (birthDate) {
          const personResult = await deps.personRepo.register(result.data.userId, {
            fullName: `${firstName} ${lastName}`.trim(),
            cpf: cpf || undefined,
            birthDate,
          });
          if (!personResult.ok) {
            console.error("[people-context] Registration failed:", personResult.message);
          }
        }

        submitting.set(false);
        deps.router.navigate(`/users/${result.data.userId}`);
      });

      cleanups.push(() => ctx.destroy());
    },

    unmount: () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
};
