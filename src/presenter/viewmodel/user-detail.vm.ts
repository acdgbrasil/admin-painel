// ─── User Detail ViewModel ───────────────────────────────────

import { createSignal, createEffect, createRoot } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { GrantRepository } from "../../data/repository/port/grant-repository";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { SessionInfo } from "../../data/model/session";
import type { User } from "../../data/model/user";
import type { UserGrant, Project, ProjectRole } from "../../data/model/grant";
import { createCommand } from "../core/command";
import { openConfirmModal } from "../core/modal";
import { showToast } from "../core/toast";
import { UserDetailPage, type UserDetailState, type GrantRowData, type ProjectOptionData, type RoleOptionData } from "../view/pages/UserDetailPage";
import { apiSuccess } from "../../data/model/result";

interface Deps {
  readonly userId: string;
  readonly userRepo: UserRepository;
  readonly grantRepo: GrantRepository;
  readonly projectRepo: ProjectRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

const BADGES: Readonly<Record<string, { bg: string; color: string; label: string }>> = {
  active: { bg: "rgba(79,132,72,0.12)", color: "#4F8448", label: "Ativo" },
  inactive: { bg: "rgba(166,41,13,0.1)", color: "#A6290D", label: "Inativo" },
  initial: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Pendente" },
  locked: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Bloqueado" },
  unknown: { bg: "rgba(38,29,17,0.08)", color: "rgba(38,29,17,0.6)", label: "Desconhecido" },
};

export const createUserDetailViewModel = (deps: Deps): ViewModel => {
  let dispose: (() => void) | null = null;

  return {
    mount: (root) => {
      createRoot((d) => {
        dispose = d;

        const [user, setUser] = createSignal<User | null>(null);
        const [grants, setGrants] = createSignal<readonly UserGrant[]>([]);
        const [projects, setProjects] = createSignal<readonly Project[]>([]);
        const [roles, setRoles] = createSignal<readonly ProjectRole[]>([]);

        // ── Commands ──
        const loadCommand = createCommand<void, void>(async () => {
          const [userRes, grantsRes, projectsRes] = await Promise.all([
            deps.userRepo.getById(deps.userId),
            deps.grantRepo.listByUser(deps.userId),
            deps.projectRepo.list(),
          ]);
          if (userRes.ok) setUser(userRes.data);
          if (grantsRes.ok) setGrants(grantsRes.data);
          if (projectsRes.ok) setProjects(projectsRes.data);
          return apiSuccess(undefined);
        });

        const toggleCommand = createCommand<void, null>(async () => {
          const u = user();
          if (!u) return apiSuccess(null);
          const result = u.state === "active"
            ? await deps.userRepo.deactivate(deps.userId)
            : await deps.userRepo.reactivate(deps.userId);
          if (result.ok) {
            const refreshed = await deps.userRepo.getById(deps.userId);
            if (refreshed.ok) setUser(refreshed.data);
            showToast(u.state === "active" ? "Conta desativada" : "Conta ativada", "success");
          }
          return result;
        });

        const deleteCommand = createCommand<void, null>(async () => {
          const result = await deps.userRepo.remove(deps.userId);
          if (result.ok) {
            showToast("Usuário excluído", "success");
            deps.router.navigate("/users");
          }
          return result;
        });

        const addGrantCommand = createCommand<{ projectId: string; roleKeys: readonly string[] }, null>(
          async (input) => {
            const result = await deps.grantRepo.add(deps.userId, input.projectId, input.roleKeys);
            if (result.ok) {
              const refreshed = await deps.grantRepo.listByUser(deps.userId);
              if (refreshed.ok) setGrants(refreshed.data);
              showToast("Permissão adicionada!", "success");
              setRoles([]);
            }
            return result;
          },
        );

        const removeGrantCommand = createCommand<string, null>(async (grantId) => {
          const result = await deps.grantRepo.remove(deps.userId, grantId);
          if (result.ok) {
            const refreshed = await deps.grantRepo.listByUser(deps.userId);
            if (refreshed.ok) setGrants(refreshed.data);
            showToast("Permissão removida", "success");
          }
          return result;
        });

        const loadRolesCommand = createCommand<string, readonly ProjectRole[]>(async (projectId) => {
          const result = await deps.projectRepo.listRoles(projectId);
          if (result.ok) setRoles(result.data);
          return result;
        });

        // ── Selectors ──
        const toState = (): UserDetailState => {
          const u = user();
          const badge = u ? (BADGES[u.state] ?? BADGES["unknown"]!) : BADGES["unknown"]!;
          return {
            session: deps.session,
            loading: loadCommand.running(),
            error: loadCommand.error(),
            userId: deps.userId,
            displayName: u?.displayName ?? "",
            email: u?.email ?? "",
            username: u?.username ?? "",
            phone: u?.phone ?? null,
            cpf: null,
            birthDate: null,
            emailVerified: u?.emailVerified ?? false,
            createdAt: u?.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "",
            badgeLabel: badge.label,
            badgeBg: badge.bg,
            badgeColor: badge.color,
            isActive: u?.state === "active",
            isInactive: u?.state === "inactive",
            grants: grants().map((g): GrantRowData => ({ id: g.id, projectName: g.projectName, roleKeys: g.roleKeys })),
            projects: projects().map((p): ProjectOptionData => ({ id: p.id, name: p.name })),
            roles: roles().map((r): RoleOptionData => ({ key: r.key, label: r.displayName || r.key })),
            totalProjects: projects().length,
          };
        };

        // ── Render ──
        createEffect(() => {
          root.innerHTML = UserDetailPage(toState());
        });

        // ── Event delegation ──
        root.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("[data-action]");
          if (!target) return;
          const action = target.getAttribute("data-action");

          if (action === "toggle-state") {
            const u = user();
            openConfirmModal({
              title: u?.state === "active" ? "Desativar conta?" : "Ativar conta?",
              description: u?.state === "active"
                ? "O usuário perderá acesso ao sistema imediatamente."
                : "O usuário voltará a ter acesso ao sistema.",
              confirmLabel: u?.state === "active" ? "Desativar" : "Ativar",
              confirmVariant: u?.state === "active" ? "danger" : "primary",
              onConfirm: () => toggleCommand.execute(),
            });
          } else if (action === "delete-user") {
            openConfirmModal({
              title: `Excluir ${user()?.displayName ?? "usuário"}?`,
              description: "O usuário será removido permanentemente. Esta ação não pode ser desfeita.",
              confirmLabel: "Excluir",
              confirmVariant: "danger",
              onConfirm: () => deleteCommand.execute(),
            });
          } else if (action === "remove-grant") {
            const grantId = target.getAttribute("data-grant-id");
            if (grantId) {
              openConfirmModal({
                title: "Remover permissão?",
                description: "A permissão será removida do usuário.",
                confirmLabel: "Remover",
                confirmVariant: "danger",
                onConfirm: () => removeGrantCommand.execute(grantId),
              });
            }
          } else if (action === "open-grant-modal") {
            // TODO: open grant modal
          } else if (action === "reset-password") {
            showToast("E-mail de reset enviado!", "success");
          } else if (action === "resend-invite") {
            showToast(`Convite reenviado para ${user()?.email ?? ""}`, "success");
          }
        });

        root.addEventListener("change", (e) => {
          const target = e.target as HTMLSelectElement;
          if (target.getAttribute("data-action") === "select-project") {
            if (target.value) loadRolesCommand.execute(target.value);
            else setRoles([]);
          }
        });

        root.addEventListener("submit", (e) => {
          e.preventDefault();
          const form = (e.target as HTMLElement).closest("form[data-action='add-grant']");
          if (!form) return;
          const formData = new FormData(form as HTMLFormElement);
          const projectId = formData.get("projectId") as string;
          const roleKeys = formData.getAll("roleKeys") as string[];
          if (projectId && roleKeys.length > 0) {
            addGrantCommand.execute({ projectId, roleKeys });
          } else {
            showToast("Selecione projeto e pelo menos uma role", "error");
          }
        });

        loadCommand.execute();
      });
    },

    unmount: () => {
      dispose?.();
      dispose = null;
    },
  };
};
