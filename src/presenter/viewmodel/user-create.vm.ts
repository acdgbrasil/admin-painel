import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { PersonRepository } from "../../data/repository/port/person-repository";
import type { SessionInfo } from "../../data/model/session";
import { createSignal, createEffect } from "../core/reactive";
import { createRenderContext, formToObject } from "../core/render";
import { userCreatePage } from "../view/pages/user-create.page";

interface Deps {
  readonly userRepo: UserRepository;
  readonly personRepo: PersonRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

export const createUserCreateViewModel = (deps: Deps): ViewModel => {
  const error = createSignal<string | null>(null);
  const submitting = createSignal(false);
  const cleanups: (() => void)[] = [];

  return {
    mount: (root) => {
      const ctx = createRenderContext(root);

      cleanups.push(createEffect(() => {
        ctx.update(userCreatePage({
          session: deps.session,
          error: error.get(),
          submitting: submitting.get(),
        }));
      }));

      ctx.onSubmit(async (form, action) => {
        if (action !== "create-user") return;

        submitting.set(true);
        error.set(null);

        const data = formToObject(form);
        const firstName = String(data["firstName"] ?? "");
        const lastName = String(data["lastName"] ?? "");
        const email = String(data["email"] ?? "");
        const username = String(data["username"] ?? "");
        const password = String(data["password"] ?? "");
        const cpf = String(data["cpf"] ?? "");
        const birthDate = String(data["birthDate"] ?? "");

        // 1. Create in Zitadel
        const result = await deps.userRepo.create({
          firstName,
          lastName,
          email,
          username: username || undefined,
          password: password || undefined,
        });

        if (!result.ok) {
          error.set(`Erro: ${result.message}`);
          submitting.set(false);
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
