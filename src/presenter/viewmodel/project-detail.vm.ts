// ─── Project Detail ViewModel ────────────────────────────────

import { createSignal, createEffect, createRoot } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { SessionInfo } from "../../data/model/session";
import { createCommand } from "../core/command";
import { openModal } from "../core/modal";
import { openConfirmModal } from "../core/modal";
import { showToast } from "../core/toast";
import { apiSuccess } from "../../data/model/result";
import { esc } from "../view/esc";
import { ProjectDetailPage, type ProjectDetailState, type RoleItemData, type ProjectUserData } from "../view/pages/ProjectDetailPage";

interface Deps {
  readonly projectId: string;
  readonly projectRepo: ProjectRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

export const createProjectDetailViewModel = (deps: Deps): ViewModel => {
  let dispose: (() => void) | null = null;

  return {
    mount: (root) => {
      createRoot((d) => {
        dispose = d;

        const [projectName, setProjectName] = createSignal("");
        const [roles, setRoles] = createSignal<readonly RoleItemData[]>([]);
        const [users, setUsers] = createSignal<readonly ProjectUserData[]>([]);

        const loadCommand = createCommand<void, void>(async () => {
          const [projectsRes, rolesRes, usersRes] = await Promise.all([
            deps.projectRepo.list(),
            deps.projectRepo.listRoles(deps.projectId),
            deps.projectRepo.listUsersWithGrants(deps.projectId),
          ]);

          if (projectsRes.ok) {
            const p = projectsRes.data.find((proj) => proj.id === deps.projectId);
            if (p) setProjectName(p.name);
          }

          if (rolesRes.ok && usersRes.ok) {
            const usersList = usersRes.data;
            setRoles(rolesRes.data.map((r): RoleItemData => ({
              key: r.key,
              userCount: usersList.filter((u) => u.roleKeys.includes(r.key)).length,
            })));
            setUsers(usersList.map((u): ProjectUserData => ({
              userId: u.userId,
              displayName: u.displayName,
              roleKeys: u.roleKeys,
            })));
          }

          return apiSuccess(undefined);
        });

        const addRoleCommand = createCommand<string, null>(async (roleKey) => {
          const result = await deps.projectRepo.addRole(deps.projectId, roleKey);
          if (result.ok) {
            showToast(`Role ${roleKey} criada!`, "success");
            await loadCommand.execute();
          }
          return result;
        });

        const removeRoleCommand = createCommand<string, null>(async (roleKey) => {
          const result = await deps.projectRepo.removeRole(deps.projectId, roleKey);
          if (result.ok) {
            showToast(`Role ${roleKey} removida`, "success");
            await loadCommand.execute();
          }
          return result;
        });

        createEffect(() => {
          root.innerHTML = ProjectDetailPage({
            session: deps.session,
            loading: loadCommand.running(),
            error: loadCommand.error(),
            projectId: deps.projectId,
            projectName: projectName(),
            roles: roles(),
            users: users(),
          });
        });

        // Event delegation
        root.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("[data-action]");
          if (!target) return;
          const action = target.getAttribute("data-action");

          if (action === "open-create-role") {
            const { close } = openModal(`
              <div class="p-8">
                <h2 class="text-xl font-bold mb-2" style="color:#261D11;">Nova Role</h2>
                <p class="text-sm font-editorial italic mb-6" style="color:rgba(38,29,17,0.5);">Use snake_case. Ex: social_worker, coordinator</p>
                <form data-action="create-role">
                  <input type="text" name="roleKey" placeholder="nome_da_role" required
                    class="w-full py-3 text-base font-editorial italic font-light"
                    style="border:none;border-bottom:1.5px solid rgba(38,29,17,0.2);background:transparent;color:#261D11;outline:none;" />
                  <div class="flex justify-end gap-3 mt-8">
                    <button type="button" data-action="close-modal" class="px-5 py-2.5 rounded-full text-sm font-medium" style="border:1.5px solid rgba(38,29,17,0.2);">Cancelar</button>
                    <button type="submit" class="px-5 py-2.5 rounded-full text-sm font-medium text-white" style="background:#172D48;">Criar role</button>
                  </div>
                </form>
              </div>
            `, "480px");

            document.getElementById("modal-container")?.addEventListener("click", (ev) => {
              const btn = (ev.target as HTMLElement).closest("[data-action='close-modal']");
              if (btn) close();
            }, { once: true });

            document.getElementById("modal-container")?.addEventListener("submit", (ev) => {
              ev.preventDefault();
              const form = ev.target as HTMLFormElement;
              const roleKey = new FormData(form).get("roleKey") as string;
              if (!roleKey?.trim()) {
                showToast("Digite o nome da role", "error");
                return;
              }
              if (!/^[a-z][a-z0-9_]*$/.test(roleKey)) {
                showToast("Use apenas letras minúsculas, números e underscore", "error");
                return;
              }
              close();
              addRoleCommand.execute(roleKey);
            }, { once: true });

          } else if (action === "remove-role") {
            const roleKey = target.getAttribute("data-role-key");
            if (!roleKey) return;
            const role = roles().find((r) => r.key === roleKey);
            openConfirmModal({
              title: `Remover role ${roleKey}?`,
              description: role && role.userCount > 0
                ? `${role.userCount} usuário(s) têm esta role atribuída. Ela será removida dos seus grants.`
                : "A role será removida do projeto.",
              confirmLabel: "Remover",
              confirmVariant: "danger",
              onConfirm: () => removeRoleCommand.execute(roleKey),
            });
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
