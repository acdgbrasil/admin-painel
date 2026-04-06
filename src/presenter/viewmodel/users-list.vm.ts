import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { SessionInfo } from "../../data/model/session";
import { STATE_BADGES } from "../../data/model/user";
import type { User } from "../../data/model/user";
import type { UserRowProps } from "../view/molecules/user-row";
import { createSignal, createEffect } from "../core/reactive";
import { createRenderContext, formToObject } from "../core/render";
import { usersListPage } from "../view/pages/users-list.page";

interface Deps {
  readonly userRepo: UserRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

const toUserRow = (user: User): UserRowProps => ({
  userId: user.id,
  displayName: user.displayName,
  email: user.email,
  username: user.username,
  badge: STATE_BADGES[user.state],
  canToggle: user.state === "active" || user.state === "inactive",
  toggleLabel: user.state === "active" ? "Desativar" : "Ativar",
});

export const createUsersListViewModel = (deps: Deps): ViewModel => {
  const loading = createSignal(true);
  const users = createSignal<readonly UserRowProps[]>([]);
  const search = createSignal("");
  const error = createSignal<string | null>(null);
  const cleanups: (() => void)[] = [];

  const fetchUsers = async (query?: string): Promise<void> => {
    loading.set(true);
    error.set(null);
    const result = await deps.userRepo.list(query);
    if (result.ok) {
      users.set(result.data.map(toUserRow));
    } else {
      error.set(result.message);
    }
    loading.set(false);
  };

  const handleToggle = async (userId: string): Promise<void> => {
    const user = users.get().find((u) => u.userId === userId);
    if (!user) return;

    if (user.badge.label === "Ativo") {
      await deps.userRepo.deactivate(userId);
    } else {
      await deps.userRepo.reactivate(userId);
    }
    await fetchUsers(search.get() || undefined);
  };

  return {
    mount: (root) => {
      const ctx = createRenderContext(root);

      cleanups.push(createEffect(() => {
        ctx.update(usersListPage({
          session: deps.session,
          users: users.get(),
          search: search.get(),
          loading: loading.get(),
          error: error.get(),
        }));
      }));

      ctx.onAction((target, action) => {
        if (action === "toggle") {
          const userId = target.dataset["userId"];
          if (userId) handleToggle(userId);
        }
      });

      ctx.onSubmit((_form, action) => {
        if (action === "search") {
          const input = root.querySelector<HTMLInputElement>("input[name=search]");
          const query = input?.value ?? "";
          search.set(query);
          fetchUsers(query || undefined);
        }
      });

      cleanups.push(() => ctx.destroy());
      fetchUsers();
    },

    unmount: () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
};
