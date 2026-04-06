import type { ViewModel, Router } from "../core/router";
import type { UserRepository } from "../../data/repository/port/user-repository";
import type { GrantRepository } from "../../data/repository/port/grant-repository";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { SessionInfo } from "../../data/model/session";
import type { User } from "../../data/model/user";
import type { UserGrant, Project, ProjectRole } from "../../data/model/grant";
import { STATE_BADGES } from "../../data/model/user";
import type { UserInfoCardProps } from "../view/organisms/user-info-card";
import type { GrantItemProps } from "../view/molecules/grant-item";
import type { RolePickerItem } from "../view/organisms/role-picker";
import { createSignal, createEffect } from "../core/reactive";
import { createRenderContext, formToObject } from "../core/render";
import { userDetailPage } from "../view/pages/user-detail.page";

interface Deps {
  readonly userId: string;
  readonly userRepo: UserRepository;
  readonly grantRepo: GrantRepository;
  readonly projectRepo: ProjectRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

const toInfoCard = (user: User): UserInfoCardProps => ({
  userId: user.id,
  displayName: user.displayName,
  email: user.email,
  username: user.username,
  phone: user.phone,
  emailVerified: user.emailVerified,
  createdAt: new Date(user.createdAt).toLocaleDateString("pt-BR"),
  badge: STATE_BADGES[user.state],
  canToggle: user.state === "active" || user.state === "inactive",
  toggleLabel: user.state === "active" ? "Desativar" : "Ativar",
});

const toGrantItem = (userId: string, grant: UserGrant): GrantItemProps => ({
  id: grant.id,
  userId,
  projectName: grant.projectName,
  roleKeys: grant.roleKeys,
});

const toRolePickerItem = (role: ProjectRole): RolePickerItem => ({
  key: role.key,
  label: role.displayName || role.key,
});

export const createUserDetailViewModel = (deps: Deps): ViewModel => {
  const loading = createSignal(true);
  const error = createSignal<string | null>(null);
  const user = createSignal<UserInfoCardProps | null>(null);
  const grants = createSignal<readonly GrantItemProps[]>([]);
  const projects = createSignal<readonly Project[]>([]);
  const roles = createSignal<readonly RolePickerItem[]>([]);
  const cleanups: (() => void)[] = [];

  const fetchAll = async (): Promise<void> => {
    loading.set(true);
    const [userRes, grantsRes, projectsRes] = await Promise.all([
      deps.userRepo.getById(deps.userId),
      deps.grantRepo.listByUser(deps.userId),
      deps.projectRepo.list(),
    ]);

    if (userRes.ok) user.set(toInfoCard(userRes.data));
    else error.set(userRes.message);

    if (grantsRes.ok) grants.set(grantsRes.data.map((g) => toGrantItem(deps.userId, g)));
    if (projectsRes.ok) projects.set(projectsRes.data);
    loading.set(false);
  };

  return {
    mount: (root) => {
      const ctx = createRenderContext(root);

      cleanups.push(createEffect(() => {
        ctx.update(userDetailPage({
          session: deps.session,
          user: user.get() ?? { userId: "", displayName: "", email: "", username: "", phone: null, emailVerified: false, createdAt: "", badge: { label: "", cls: "" }, canToggle: false, toggleLabel: "" },
          grants: grants.get(),
          projects: projects.get(),
          roles: roles.get(),
          loading: loading.get(),
          error: error.get(),
        }));
      }));

      ctx.onAction(async (target, action) => {
        if (action === "toggle") {
          const u = user.get();
          if (!u) return;
          if (u.badge.label === "Ativo") await deps.userRepo.deactivate(deps.userId);
          else await deps.userRepo.reactivate(deps.userId);
          await fetchAll();
        } else if (action === "delete") {
          await deps.userRepo.remove(deps.userId);
          deps.router.navigate("/users");
        } else if (action === "remove-grant") {
          const grantId = target.dataset["grantId"];
          if (grantId) {
            await deps.grantRepo.remove(deps.userId, grantId);
            const res = await deps.grantRepo.listByUser(deps.userId);
            if (res.ok) grants.set(res.data.map((g) => toGrantItem(deps.userId, g)));
          }
        } else if (action === "load-roles") {
          const select = target as HTMLSelectElement;
          const projectId = select.value;
          if (projectId) {
            const res = await deps.projectRepo.listRoles(projectId);
            if (res.ok) roles.set(res.data.map(toRolePickerItem));
          } else {
            roles.set([]);
          }
        }
      });

      ctx.onSubmit(async (form, action) => {
        if (action === "add-grant") {
          const data = formToObject(form);
          const projectId = typeof data["projectId"] === "string" ? data["projectId"] : "";
          const roleKeys = Array.isArray(data["roleKeys"]) ? data["roleKeys"] : data["roleKeys"] ? [data["roleKeys"]] : [];
          if (projectId && roleKeys.length > 0) {
            await deps.grantRepo.add(deps.userId, projectId, roleKeys as string[]);
            const res = await deps.grantRepo.listByUser(deps.userId);
            if (res.ok) grants.set(res.data.map((g) => toGrantItem(deps.userId, g)));
            roles.set([]);
          }
        }
      });

      // Listen for select change (load-roles)
      root.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (target.dataset["action"] === "load-roles") {
          const select = target as HTMLSelectElement;
          const projectId = select.value;
          if (projectId) {
            deps.projectRepo.listRoles(projectId).then((res) => {
              if (res.ok) roles.set(res.data.map(toRolePickerItem));
            });
          } else {
            roles.set([]);
          }
        }
      });

      cleanups.push(() => ctx.destroy());
      fetchAll();
    },

    unmount: () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
};
