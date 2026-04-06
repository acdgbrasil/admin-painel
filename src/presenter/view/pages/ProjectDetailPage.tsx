import { AppShell } from "../templates/AppShell";
import { Avatar } from "../atoms/Avatar";
import { esc } from "../esc";
import type { SessionInfo } from "../../../data/model/session";

export interface RoleItemData {
  readonly key: string;
  readonly userCount: number;
}

export interface ProjectUserData {
  readonly userId: string;
  readonly displayName: string;
  readonly roleKeys: readonly string[];
}

export interface ProjectDetailState {
  readonly session: SessionInfo;
  readonly loading: boolean;
  readonly error: string | null;
  readonly projectId: string;
  readonly projectName: string;
  readonly roles: readonly RoleItemData[];
  readonly users: readonly ProjectUserData[];
}

export const ProjectDetailPage = (state: ProjectDetailState): string =>
  AppShell({
    session: state.session,
    activePath: "/projects",
    children: (
      <div>
        <a href="/projects" class="text-sm font-medium mb-6 inline-block" style="color:rgba(38,29,17,0.5);">
          ← Projetos & Roles
        </a>

        {state.loading ? (
          <div class="text-center py-12">
            <p class="font-editorial italic" style="color:rgba(38,29,17,0.5);">Carregando...</p>
          </div>
        ) : state.error ? (
          <p style="color:#A6290D;">{state.error as "safe"}</p>
        ) : (
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Col 1-2: Info + Roles */}
            <div class="lg:col-span-2 space-y-6">
              {/* Info */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:#172D48;">
                    <span class="text-lg font-bold" style="color:#F2E2C4;">P</span>
                  </div>
                  <div>
                    <h1 class="text-2xl font-bold" style="color:#261D11;">{state.projectName as "safe"}</h1>
                    <p class="text-sm font-editorial italic" style="color:rgba(38,29,17,0.5);">{state.projectId as "safe"}</p>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-4 pt-4" style="border-top:1px solid rgba(38,29,17,0.08);">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.4);">Roles</p>
                    <p class="text-xl font-bold mt-1">{String(state.roles.length)}</p>
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.4);">Usuários</p>
                    <p class="text-xl font-bold mt-1">{String(state.users.length)}</p>
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.4);">ID</p>
                    <p class="text-xs font-mono mt-2" style="color:rgba(38,29,17,0.5);">{state.projectId as "safe"}</p>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-base font-bold" style="color:#261D11;">Roles disponíveis</h2>
                  <button data-action="open-create-role"
                    class="px-4 py-2 rounded-full text-sm font-medium font-editorial italic text-white"
                    style="background:#172D48;">
                    + Nova role
                  </button>
                </div>

                {state.roles.length === 0 ? (
                  <div class="py-8 text-center rounded-xl" style="border:2px dashed rgba(38,29,17,0.1);">
                    <p class="font-editorial italic text-sm" style="color:rgba(38,29,17,0.4);">
                      Nenhuma role definida — crie a primeira
                    </p>
                  </div>
                ) : (
                  <div class="space-y-2">
                    {state.roles.map((r) => `
                      <div class="flex items-center justify-between py-3 px-4 rounded-xl" style="background:rgba(38,29,17,0.03);">
                        <div class="flex items-center gap-3">
                          <span class="w-2 h-2 rounded-full" style="background:#4F8448;"></span>
                          <span class="text-sm font-semibold" style="color:#261D11;">${esc(r.key)}</span>
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.5);">${r.userCount} usuário(s)</span>
                          <button data-action="remove-role" data-role-key="${esc(r.key)}"
                            class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                            style="color:rgba(38,29,17,0.3);">
                            🗑
                          </button>
                        </div>
                      </div>
                    `).join("") as "safe"}
                  </div>
                )}
              </div>
            </div>

            {/* Col 3: Users with access */}
            <div>
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <h3 class="text-sm font-bold mb-4" style="color:#261D11;">Usuários com acesso</h3>
                {state.users.length === 0 ? (
                  <p class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.4);">
                    Nenhum usuário tem acesso a este projeto
                  </p>
                ) : (
                  <div class="space-y-3">
                    {state.users.map((u) => `
                      <a href="/users/${u.userId}" class="flex items-center gap-3 p-2 rounded-xl transition-colors" style="color:#261D11;">
                        ${Avatar({ name: u.displayName, size: "sm" })}
                        <div>
                          <p class="text-sm font-medium">${esc(u.displayName)}</p>
                          <div class="flex gap-1 mt-0.5">
                            ${u.roleKeys.map((r) => `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium" style="background:rgba(38,29,17,0.07);">${esc(r)}</span>`).join("")}
                          </div>
                        </div>
                      </a>
                    `).join("") as "safe"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    ) as unknown as string,
  });
