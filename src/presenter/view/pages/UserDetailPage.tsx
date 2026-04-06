import { esc } from "../esc";
import { AppShell } from "../templates/AppShell";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import type { SessionInfo } from "../../../data/model/session";

// ─── Types ───────────────────────────────────────────────────

export type GrantRowData = GrantRow;
export type ProjectOptionData = ProjectOption;
export type RoleOptionData = RoleOption;

export interface GrantRow {
  readonly id: string;
  readonly projectName: string;
  readonly roleKeys: readonly string[];
}

export interface ProjectOption {
  readonly id: string;
  readonly name: string;
}

export interface RoleOption {
  readonly key: string;
  readonly label: string;
}

export interface UserDetailState {
  readonly session: SessionInfo;
  readonly loading: boolean;
  readonly error: string | null;
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly phone: string | null;
  readonly cpf: string | null;
  readonly birthDate: string | null;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly badgeLabel: string;
  readonly badgeBg: string;
  readonly badgeColor: string;
  readonly isActive: boolean;
  readonly isInactive: boolean;
  readonly grants: readonly GrantRow[];
  readonly projects: readonly ProjectOption[];
  readonly roles: readonly RoleOption[];
  readonly totalProjects: number;
}

// ─── Sub-components ──────────────────────────────────────────

const InfoField = (p: { label: string; value: string; mono?: boolean }): string => (
  <div>
    <p class="text-[11px] font-bold uppercase tracking-[1.5px] mb-1" style="color:rgba(38,29,17,0.4);">{p.label}</p>
    <p class={`text-sm ${p.mono ? "font-mono text-xs" : ""}`} style="color:#261D11;">{p.value as "safe"}</p>
  </div>
) as unknown as string;

const GrantItem = (p: { grant: GrantRow; userId: string }): string => (
  <div class="flex items-center justify-between p-4 rounded-xl" style="background:rgba(38,29,17,0.03);border:1px solid rgba(38,29,17,0.07);">
    <div>
      <span class="text-sm font-semibold" style="color:#261D11;">{p.grant.projectName as "safe"}</span>
      <div class="flex gap-1.5 mt-1.5">
        {p.grant.roleKeys.map((r) =>
          `<span class="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium" style="background:rgba(38,29,17,0.07);">${esc(r)}</span>`
        ).join("") as "safe"}
      </div>
    </div>
    <button
      data-action="remove-grant"
      data-grant-id={p.grant.id}
      class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
      style="color:rgba(38,29,17,0.3);"
    >
      ✕
    </button>
  </div>
) as unknown as string;

const Toggle = (p: { on: boolean }): string => (
  <div data-action="toggle-state" class={`toggle-track cursor-pointer ${p.on ? "toggle-on" : "toggle-off"}`}>
    <div class="toggle-thumb"></div>
  </div>
) as unknown as string;

// ─── Page ────────────────────────────────────────────────────

export const UserDetailPage = (state: UserDetailState): string =>
  AppShell({
    session: state.session,
    activePath: "/users",
    children: (
      <div>
        {/* Breadcrumb */}
        <a href="/users" class="text-sm font-medium mb-6 inline-block" style="color:rgba(38,29,17,0.5);">
          ← Usuários
        </a>

        {state.loading ? (
          <div class="text-center py-12">
            <p class="font-editorial italic" style="color:rgba(38,29,17,0.5);">Carregando...</p>
          </div>
        ) : state.error ? (
          <div class="text-center py-12">
            <p style="color:#A6290D;">{state.error as "safe"}</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Col 1-2: User Info + Grants */}
            <div class="lg:col-span-2 space-y-6">
              {/* User Info Card */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-4">
                    {Avatar({ name: state.displayName, size: "lg" })}
                    <div>
                      <h1 class="text-2xl font-bold" style="color:#261D11;">{state.displayName as "safe"}</h1>
                      <p class="text-sm font-editorial italic" style="color:rgba(38,29,17,0.5);">@{state.username as "safe"}</p>
                      <div class="flex gap-2 mt-2">
                        {Badge({ label: state.badgeLabel, bg: state.badgeBg, color: state.badgeColor })}
                        {state.emailVerified
                          ? Badge({ label: "e-mail verificado", bg: "rgba(79,132,72,0.1)", color: "#4F8448" })
                          : Badge({ label: "e-mail não verificado", bg: "rgba(166,41,13,0.08)", color: "#A6290D" })}
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    {Button({ label: "🔑", variant: "outline", "data-action": "reset-password" })}
                    {Button({ label: "🗑", variant: "outline", "data-action": "delete-user", class: "hover:bg-red-50" })}
                  </div>
                </div>

                <div class="mt-6 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-5" style="border-top:1px solid rgba(38,29,17,0.08);">
                  {InfoField({ label: "E-mail", value: state.email })}
                  {InfoField({ label: "Telefone", value: state.phone ?? "—" })}
                  {InfoField({ label: "CPF", value: state.cpf ?? "—" })}
                  {InfoField({ label: "Nascimento", value: state.birthDate ?? "—" })}
                  {InfoField({ label: "ID do usuário", value: state.userId, mono: true })}
                  {InfoField({ label: "Cadastrado em", value: state.createdAt })}
                </div>
              </div>

              {/* Grants Card */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-base font-bold" style="color:#261D11;">Permissões</h2>
                  {Button({ label: "+ Adicionar", variant: "primary", "data-action": "open-grant-modal" })}
                </div>

                {state.grants.length === 0 ? (
                  <div class="py-8 text-center rounded-xl" style="border:2px dashed rgba(38,29,17,0.1);">
                    <p class="font-editorial italic text-sm" style="color:rgba(38,29,17,0.4);">Nenhuma permissão atribuída</p>
                  </div>
                ) : (
                  <div class="space-y-3">
                    {state.grants.map((g) => GrantItem({ grant: g, userId: state.userId })).join("") as "safe"}
                  </div>
                )}
              </div>
            </div>

            {/* Col 3: Sidebar cards */}
            <div class="space-y-6">
              {/* State Card */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <h3 class="text-sm font-bold mb-4" style="color:#261D11;">Estado da conta</h3>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm" style="color:#261D11;">
                    {state.isActive ? "Conta ativa" : "Conta inativa"}
                  </span>
                  {Toggle({ on: state.isActive })}
                </div>
                <p class="text-xs font-editorial italic" style="color:rgba(38,29,17,0.4);">
                  {state.isActive
                    ? "O usuário pode acessar o sistema"
                    : "O usuário não pode acessar o sistema"}
                </p>
                <div class="mt-6 pt-4" style="border-top:1px solid rgba(38,29,17,0.08);">
                  <button
                    data-action="delete-user"
                    class="w-full px-4 py-2.5 rounded-full text-sm font-medium"
                    style="border:1.5px solid #A6290D;color:#A6290D;"
                  >
                    Excluir usuário
                  </button>
                </div>
              </div>

              {/* Credentials Card */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <h3 class="text-sm font-bold mb-4" style="color:#261D11;">Credenciais</h3>
                <div class="space-y-3">
                  <button data-action="reset-password" class="w-full px-4 py-2.5 rounded-full text-sm font-medium" style="border:1.5px solid rgba(38,29,17,0.2);color:#261D11;">
                    Forçar reset de senha
                  </button>
                  <button data-action="resend-invite" class="w-full px-4 py-2.5 rounded-full text-sm font-medium" style="border:1.5px solid rgba(38,29,17,0.2);color:#261D11;">
                    Reenviar convite
                  </button>
                </div>
              </div>

              {/* Progress Card */}
              <div class="rounded-2xl p-6" style="background:#FAF0E0;">
                <h3 class="text-sm font-bold" style="color:#261D11;">Progresso</h3>
                <p class="text-xs font-editorial italic mt-1" style="color:rgba(38,29,17,0.4);">Permissões configuradas</p>
                <div class="mt-3 h-[3px] rounded-full" style="background:rgba(38,29,17,0.1);">
                  <div
                    class="h-full rounded-full"
                    style={`background:#4F8448;width:${state.totalProjects > 0 ? Math.round((state.grants.length / state.totalProjects) * 100) : 0}%;`}
                  ></div>
                </div>
                <p class="text-xs font-bold mt-2" style="color:rgba(38,29,17,0.5);">
                  {String(state.grants.length)} de {String(state.totalProjects)} projetos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    ) as unknown as string,
  });
