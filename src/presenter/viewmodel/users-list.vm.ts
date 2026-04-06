import { createSignal, createEffect, createRoot } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { SessionInfo } from "../../data/model/session";
import type { User } from "../../data/model/user";
import { STATE_BADGES } from "../../data/model/user";
import { UsersListPage, type UserRow, type UsersListState } from "../view/pages/UsersListPage";
import { showToast } from "../core/toast";

interface Deps {
  readonly userRepo: UserRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

const BADGE_MAP: Readonly<Record<string, { bg: string; color: string; label: string }>> = {
  active: { bg: "rgba(79,132,72,0.12)", color: "#4F8448", label: "Ativo" },
  inactive: { bg: "rgba(166,41,13,0.1)", color: "#A6290D", label: "Inativo" },
  initial: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Pendente" },
  locked: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Bloqueado" },
  unknown: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Desconhecido" },
};

const toRow = (user: User): UserRow => {
  const badge = BADGE_MAP[user.state] ?? BADGE_MAP["unknown"]!;
  return {
    userId: user.id,
    displayName: user.displayName,
    email: user.email,
    username: user.username,
    badgeLabel: badge.label,
    badgeBg: badge.bg,
    badgeColor: badge.color,
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "",
  };
};

export const createUsersListViewModel = (deps: Deps): ViewModel => {
  let dispose: (() => void) | null = null;

  return {
    mount: (root) => {
      createRoot((d) => {
        dispose = d;

        const [loading, setLoading] = createSignal(true);
        const [users, setUsers] = createSignal<readonly UserRow[]>([]);
        const [search, setSearch] = createSignal("");
        const [error, setError] = createSignal<string | null>(null);
        const [total, setTotal] = createSignal(0);
        const [activeCount, setActiveCount] = createSignal(0);
        const [inactiveCount, setInactiveCount] = createSignal(0);
        const [pendingCount, setPendingCount] = createSignal(0);

        const fetchUsers = async (query?: string): Promise<void> => {
          setLoading(true);
          setError(null);
          const result = await deps.userRepo.list(query);
          if (result.ok) {
            const all = result.data;
            const rows = all.map(toRow);
            setUsers(rows);
            setTotal(all.length);
            setActiveCount(all.filter((u) => u.state === "active").length);
            setInactiveCount(all.filter((u) => u.state === "inactive").length);
            setPendingCount(all.filter((u) => u.state === "initial").length);
          } else {
            setError(result.message);
          }
          setLoading(false);
        };

        // Render effect
        createEffect(() => {
          const state: UsersListState = {
            session: deps.session,
            users: users(),
            search: search(),
            loading: loading(),
            error: error(),
            total: total(),
            activeCount: activeCount(),
            inactiveCount: inactiveCount(),
            pendingCount: pendingCount(),
          };
          root.innerHTML = UsersListPage(state);
        });

        // Event delegation
        root.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("[data-action]");
          if (!target) return;
          const action = target.getAttribute("data-action");

          if (action === "navigate-user") {
            const userId = target.getAttribute("data-user-id");
            if (userId) deps.router.navigate(`/users/${userId}`);
          } else if (action === "clear-search") {
            setSearch("");
            fetchUsers();
          } else if (action === "open-create-modal") {
            deps.router.navigate("/users/new");
          }
        });

        // Search on enter
        root.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLInputElement;
            if (target.getAttribute("data-action") === "search") {
              setSearch(target.value);
              fetchUsers(target.value || undefined);
            }
          }
        });

        fetchUsers();
      });
    },

    unmount: () => {
      dispose?.();
      dispose = null;
    },
  };
};
