import { AppShell } from "../templates/AppShell";
import { esc } from "../esc";
import type { SessionInfo } from "../../../data/model/session";

export interface ProjectCardData {
  readonly id: string;
  readonly name: string;
  readonly roleCount: number;
  readonly userCount: number;
  readonly roleNames: readonly string[];
}

export interface ProjectsListState {
  readonly session: SessionInfo;
  readonly projects: readonly ProjectCardData[];
  readonly loading: boolean;
  readonly error: string | null;
}

const ProjectCard = (p: ProjectCardData): string => (
  <a href={`/projects/${p.id}`}
    class="block rounded-2xl p-5 transition-all duration-200 cursor-pointer"
    style="background:#FAF0E0;border:1.5px solid rgba(38,29,17,0.08);">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#172D48;">
        <span class="text-sm font-bold" style="color:#F2E2C4;">P</span>
      </div>
      <div>
        <p class="text-sm font-bold" style="color:#261D11;">{p.name as "safe"}</p>
        <p class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.5);">{p.id as "safe"}</p>
      </div>
    </div>

    <div class="mb-3" style="border-top:1px solid rgba(38,29,17,0.08);padding-top:12px;">
      <p class="text-[11px] font-bold uppercase tracking-[1.5px] mb-2" style="color:rgba(38,29,17,0.4);">
        Roles ({String(p.roleCount)})
      </p>
      <div class="flex flex-wrap gap-1.5">
        {p.roleNames.length > 0
          ? (p.roleNames.slice(0, 3).map((r) =>
              `<span class="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium" style="background:rgba(38,29,17,0.07);">${esc(r)}</span>`
            ).join("") + (p.roleNames.length > 3
              ? `<span class="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium" style="background:rgba(38,29,17,0.07);">+${p.roleNames.length - 3}</span>`
              : "")) as "safe"
          : `<span class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.4);">Nenhuma role definida</span>` as "safe"}
      </div>
    </div>

    <p class="text-xs" style="color:rgba(38,29,17,0.5);">
      {String(p.userCount)} usuário(s) com acesso
    </p>
  </a>
) as unknown as string;

export const ProjectsListPage = (state: ProjectsListState): string =>
  AppShell({
    session: state.session,
    activePath: "/projects",
    children: (
      <div>
        <div class="mb-6">
          <h1 class="text-2xl font-bold" style="color:#261D11;">Projetos & Roles</h1>
          <p class="text-sm mt-1" style="color:rgba(38,29,17,0.5);">
            {String(state.projects.length)} projetos · gerenciamento de roles
          </p>
        </div>

        {state.loading ? (
          <div class="text-center py-12">
            <p class="font-editorial italic" style="color:rgba(38,29,17,0.5);">Carregando...</p>
          </div>
        ) : state.error ? (
          <div class="text-center py-12">
            <p style="color:#A6290D;">{state.error as "safe"}</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.projects.map((p) => ProjectCard(p)).join("") as "safe"}
          </div>
        )}
      </div>
    ) as unknown as string,
  });
