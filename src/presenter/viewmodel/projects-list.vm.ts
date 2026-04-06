// ─── Projects List ViewModel ─────────────────────────────────

import { createSignal, createEffect, createRoot } from "solid-js";
import type { ViewModel, Router } from "../core/router";
import type { ProjectRepository } from "../../data/repository/port/project-repository";
import type { SessionInfo } from "../../data/model/session";
import { createCommand } from "../core/command";
import { apiSuccess } from "../../data/model/result";
import { ProjectsListPage, type ProjectCardData } from "../view/pages/ProjectsListPage";

interface Deps {
  readonly projectRepo: ProjectRepository;
  readonly router: Router;
  readonly session: SessionInfo;
}

export const createProjectsListViewModel = (deps: Deps): ViewModel => {
  let dispose: (() => void) | null = null;

  return {
    mount: (root) => {
      createRoot((d) => {
        dispose = d;

        const [cards, setCards] = createSignal<readonly ProjectCardData[]>([]);

        const loadCommand = createCommand<void, void>(async () => {
          const projectsResult = await deps.projectRepo.list();
          if (!projectsResult.ok) return projectsResult;

          const projectCards: ProjectCardData[] = [];
          for (const p of projectsResult.data) {
            const rolesResult = await deps.projectRepo.listRoles(p.id);
            const usersResult = await deps.projectRepo.listUsersWithGrants(p.id);
            const roleNames = rolesResult.ok ? rolesResult.data.map((r) => r.key) : [];
            projectCards.push({
              id: p.id,
              name: p.name,
              roleCount: roleNames.length,
              userCount: usersResult.ok ? usersResult.data.length : 0,
              roleNames,
            });
          }
          setCards(projectCards);
          return apiSuccess(undefined);
        });

        createEffect(() => {
          root.innerHTML = ProjectsListPage({
            session: deps.session,
            projects: cards(),
            loading: loadCommand.running(),
            error: loadCommand.error(),
          });
        });

        root.addEventListener("click", (e) => {
          const target = (e.target as HTMLElement).closest("a[href]");
          if (!target) return;
          // SPA navigation handled by router's global click handler
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
