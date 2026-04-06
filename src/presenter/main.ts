// ─── Client Entry Point ──────────────────────────────────────

import type { SessionInfo } from "../data/model/session";
import { createRouter } from "./core/router";
import { createHttpClient } from "./core/http";
import { createApiUserRepository } from "../data/repository/adapter/client/api-user-repository";
import { createApiGrantRepository } from "../data/repository/adapter/client/api-grant-repository";
import { createApiProjectRepository } from "../data/repository/adapter/client/api-project-repository";
import { createApiPersonRepository } from "../data/repository/adapter/client/api-person-repository";
import { createLoginViewModel } from "./viewmodel/login.vm";
import { createUsersListViewModel } from "./viewmodel/users-list.vm";
import { createUserDetailViewModel } from "./viewmodel/user-detail.vm";

const boot = async (): Promise<void> => {
  const root = document.getElementById("app");
  if (!root) return;

  // ── DI: Repositories ──
  const http = createHttpClient();
  const userRepo = createApiUserRepository(http);
  const grantRepo = createApiGrantRepository(http);
  const projectRepo = createApiProjectRepository(http);
  const personRepo = createApiPersonRepository(http);

  // ── Session ──
  const sessionResult = await http.get<SessionInfo>("/api/v1/me");
  const session: SessionInfo | null = sessionResult.ok ? sessionResult.data : null;

  // ── Router + DI wiring ──
  const router = createRouter();

  router.register("/login", () => createLoginViewModel());

  const guard = <T extends Record<string, string>>(
    factory: (params: T, s: SessionInfo) => ReturnType<typeof createLoginViewModel>,
  ) => (params: T) => {
    if (!session) {
      window.location.href = "/auth/login";
      return createLoginViewModel();
    }
    return factory(params, session);
  };

  router.register("/users", guard((_p, s) =>
    createUsersListViewModel({ userRepo, router, session: s }),
  ));

  router.register("/users/new", guard((_p, s) =>
    createUsersListViewModel({ userRepo, router, session: s }),
  ));

  router.register("/users/:id", guard((p, s) =>
    createUserDetailViewModel({
      userId: p["id"]!,
      userRepo,
      grantRepo,
      projectRepo,
      router,
      session: s,
    }),
  ));

  router.start(root);
};

boot();
