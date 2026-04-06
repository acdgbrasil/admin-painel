// ─── Users List ViewModel ────────────────────────────────────

import { createSignal, createEffect, createRoot } from "solid-js";
import type { Accessor } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { SessionInfo } from "../../data/model/session";
import type { User } from "../../data/model/user";
import { createCommand, type Command } from "../core/command";
import { apiSuccess } from "../../data/model/result";
import { UsersListPage, type UserRowData } from "../view/pages/UsersListPage";

// ─── Deps ─────────────────────────────────────────────────��──

interface Deps {
  readonly userRepo: UserRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

// ─── Badge mapping ───────────────────────────────────────────

const BADGES: Readonly<Record<string, { bg: string; color: string; label: string }>> = {
  active: { bg: "rgba(79,132,72,0.12)", color: "#4F8448", label: "Ativo" },
  inactive: { bg: "rgba(166,41,13,0.1)", color: "#A6290D", label: "Inativo" },
  initial: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Pendente" },
  locked: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Bloqueado" },
  unknown: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Desconhecido" },
};

const toRow = (user: User): UserRowData => {
  const badge = BADGES[user.state] ?? BADGES["unknown"]!;
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

// ─── ViewModel ───────────────────────────────────────────────

export const createUsersListViewModel = (deps: Deps): ViewModel => {
  let dispose: (() => void) | null = null;

  return {
    mount: (root) => {
      createRoot((d) => {
        dispose = d;

        // ── Signals ──
        const [users, setUsers] = createSignal<readonly User[]>([]);
        const [rows, setRows] = createSignal<readonly UserRowData[]>([]);
        const [search, setSearch] = createSignal("");

        // ── Commands ──
        const loadCommand = createCommand<string | undefined, readonly User[]>(
          async (query) => {
            const result = await deps.userRepo.list(query);
            if (result.ok) {
              setUsers(result.data);
              setRows(result.data.map(toRow));
            }
            return result;
          },
        );

        // ── Derived (selectors) ──
        const total = (): number => users().length;
        const activeCount = (): number => users().filter((u) => u.state === "active").length;
        const inactiveCount = (): number => users().filter((u) => u.state === "inactive").length;
        const pendingCount = (): number => users().filter((u) => u.state === "initial").length;

        // ── Connectors (actions) ──
        const onSearch = (query: string): void => {
          setSearch(query);
          loadCommand.execute(query || undefined);
        };

        const onClearSearch = (): void => {
          setSearch("");
          loadCommand.execute(undefined);
        };

        const onNavigateUser = (userId: string): void => {
          deps.router.navigate(`/users/${userId}`);
        };

        const onCreateUser = (): void => {
          deps.router.navigate("/users/new");
        };

        // ── Render effect ──
        createEffect(() => {
          root.innerHTML = UsersListPage({
            // Selectors (data)
            session: deps.session,
            users: rows(),
            search: search(),
            loading: loadCommand.running(),
            error: loadCommand.error(),
            total: total(),
            activeCount: activeCount(),
            inactiveCount: inactiveCount(),
            pendingCount: pendingCount(),
            // Connectors (actions) — encoded as data-action in View
          });
        });

        // ── Event delegation ──
        root.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("[data-action]");
          if (!target) return;
          const action = target.getAttribute("data-action");

          if (action === "navigate-user") {
            const userId = target.getAttribute("data-user-id");
            if (userId) onNavigateUser(userId);
          } else if (action === "clear-search") {
            onClearSearch();
          } else if (action === "open-create-modal") {
            onCreateUser();
          }
        });

        root.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLInputElement;
            if (target.getAttribute("data-action") === "search") {
              onSearch(target.value);
            }
          }
        });

        // ── Initial load ──
        loadCommand.execute(undefined);
      });
    },

    unmount: () => {
      dispose?.();
      dispose = null;
    },
  };
};
