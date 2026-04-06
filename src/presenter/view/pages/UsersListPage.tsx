import { AppShell } from "../templates/AppShell";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import type { SessionInfo } from "../../../data/model/session";

// ─── Types ───────────────────────────────────────────────────

export type UserRowData = UserRow;

export interface UserRow {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly badgeLabel: string;
  readonly badgeBg: string;
  readonly badgeColor: string;
  readonly createdAt: string;
}

export interface UsersListState {
  readonly session: SessionInfo;
  readonly users: readonly UserRow[];
  readonly search: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly total: number;
  readonly activeCount: number;
  readonly inactiveCount: number;
  readonly pendingCount: number;
}

// ─── Sub-components ──────────────────────────────────────────

const StatCard = (p: { label: string; value: number; color: string }): string => (
  <div class="rounded-xl p-5" style="background:#FAF0E0;">
    <p class="text-[11px] font-bold uppercase tracking-[2px]" style="color:rgba(38,29,17,0.4);">{p.label}</p>
    <p class="text-[30px] font-bold mt-1" style={`color:${p.color};`}>{String(p.value)}</p>
  </div>
) as unknown as string;

const UserTableRow = (row: UserRow): string => (
  <tr
    class="cursor-pointer transition-colors"
    style="border-bottom:1px solid rgba(38,29,17,0.06);"
    data-action="navigate-user"
    data-user-id={row.userId}
  >
    <td class="px-5 py-4">
      <div class="flex items-center gap-3">
        {Avatar({ name: row.displayName })}
        <div>
          <p class="text-sm font-semibold" style="color:#261D11;">{row.displayName as "safe"}</p>
          <p class="text-xs" style="color:rgba(38,29,17,0.5);">{row.email as "safe"}</p>
        </div>
      </div>
    </td>
    <td class="px-5 py-4 text-sm" style="color:rgba(38,29,17,0.5);">@{row.username as "safe"}</td>
    <td class="px-5 py-4">{Badge({ label: row.badgeLabel, bg: row.badgeBg, color: row.badgeColor })}</td>
    <td class="px-5 py-4 text-sm hidden lg:table-cell" style="color:rgba(38,29,17,0.5);">{row.createdAt as "safe"}</td>
    <td class="px-5 py-4 text-right">
      <a
        href={`/users/${row.userId}`}
        class="px-3 py-1.5 rounded-full text-xs font-medium"
        style="border:1.5px solid rgba(38,29,17,0.2);color:rgba(38,29,17,0.6);"
      >
        Ver
      </a>
    </td>
  </tr>
) as unknown as string;

// ─── Page ────────────────────────────────────────────────────

export const UsersListPage = (state: UsersListState): string =>
  AppShell({
    session: state.session,
    activePath: "/users",
    children: (
      <div>
        {/* Header */}
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-2xl font-bold" style="color:#261D11;">Usuários</h1>
            <p class="text-sm mt-1" style="color:rgba(38,29,17,0.5);">
              {String(state.total)} usuários cadastrados · {String(state.activeCount)} ativos
            </p>
          </div>
          <button
            data-action="open-create-modal"
            class="px-5 py-2.5 rounded-full text-sm font-medium font-editorial italic text-white"
            style="background:#4F8448;"
          >
            + Novo usuário
          </button>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-4">
          {StatCard({ label: "Total", value: state.total, color: "#261D11" })}
          {StatCard({ label: "Ativos", value: state.activeCount, color: "#4F8448" })}
          {StatCard({ label: "Inativos", value: state.inactiveCount, color: "#A6290D" })}
          {StatCard({ label: "Pendentes", value: state.pendingCount, color: "rgba(38,29,17,0.5)" })}
        </div>

        {/* Search */}
        <div class="mb-6 relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style="color:rgba(38,29,17,0.3);">🔍</span>
          <input
            type="text"
            name="search"
            data-action="search"
            placeholder="Buscar por nome, email ou username..."
            value={state.search}
            class="w-full pl-10 pr-10 py-3 rounded-full text-[15px] font-editorial italic font-light"
            style="border:1.5px solid rgba(38,29,17,0.2);background:rgba(250,240,224,0.5);color:#261D11;"
          />
          {state.search ? (
            <button data-action="clear-search" class="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style="color:rgba(38,29,17,0.4);">
              ✕
            </button>
          ) : ""}
        </div>

        {/* Content */}
        {state.loading ? (
          <div class="text-center py-12">
            <p class="font-editorial italic" style="color:rgba(38,29,17,0.5);">Carregando...</p>
          </div>
        ) : state.error ? (
          <div class="text-center py-12">
            <p style="color:#A6290D;">{state.error as "safe"}</p>
          </div>
        ) : state.users.length === 0 ? (
          <div class="text-center py-16">
            <p class="text-4xl mb-3" style="opacity:0.2;">👤</p>
            <p class="font-editorial italic text-[15px]" style="color:rgba(38,29,17,0.5);">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div class="rounded-2xl overflow-hidden" style="background:#FAF0E0;">
            <table class="w-full">
              <thead>
                <tr style="border-bottom:1.5px solid rgba(38,29,17,0.1);">
                  <th class="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.45);">Usuário</th>
                  <th class="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.45);">Username</th>
                  <th class="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.45);">Status</th>
                  <th class="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[1.5px] hidden lg:table-cell" style="color:rgba(38,29,17,0.45);">Criado em</th>
                  <th class="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-[1.5px]" style="color:rgba(38,29,17,0.45);">Ação</th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((u) => UserTableRow(u)).join("") as "safe"}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ) as unknown as string,
  });
