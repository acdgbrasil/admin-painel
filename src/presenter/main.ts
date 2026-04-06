// ─── Client Entry Point (SPA) ────────────────────────────────
// Bundled by Bun.build → public/app.js

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
import { createUserCreateViewModel } from "./viewmodel/user-create.vm";

// ─── Bootstrap ───────────────────────────────────────────────

const boot = async (): Promise<void> => {
  const root = document.getElementById("app");
  if (!root) return;

  const http = createHttpClient();
  const userRepo = createApiUserRepository(http);
  const grantRepo = createApiGrantRepository(http);
  const projectRepo = createApiProjectRepository(http);
  const personRepo = createApiPersonRepository(http);

  // Fetch session info
  const sessionResult = await http.get<SessionInfo>("/api/v1/me");
  const session: SessionInfo | null = sessionResult.ok ? sessionResult.data : null;

  const router = createRouter();

  // Public routes
  router.register("/login", () => createLoginViewModel());

  // Protected routes (redirect to /login if no session)
  const guard = <T extends Record<string, string>>(
    factory: (params: T, session: SessionInfo) => ReturnType<typeof createUsersListViewModel>,
  ) => (params: T) => {
    if (!session) {
      window.location.href = "/auth/login";
      return createLoginViewModel();
    }
    return factory(params, session);
  };

  router.register("/users", guard((_params, s) =>
    createUsersListViewModel({ userRepo, router, session: s }),
  ));

  router.register("/users/new", guard((_params, s) =>
    createUserCreateViewModel({ userRepo, personRepo, router, session: s }),
  ));

  router.register("/users/:id", guard((params, s) =>
    createUserDetailViewModel({
      userId: params["id"]!,
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
