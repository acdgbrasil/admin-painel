import type { Session } from "../auth";
import type { ZitadelUser } from "../zitadel";
import { layout, esc } from "./layout";

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  USER_STATE_ACTIVE: { label: "Ativo", cls: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", cls: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", cls: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", cls: "bg-yellow-100 text-yellow-800" },
};

const badge = (state: string) => {
  const s = STATE_LABELS[state] ?? { label: state, cls: "bg-gray-100 text-gray-600" };
  return `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${s.cls}">${s.label}</span>`;
};

export const usersPage = (session: Session, users: readonly ZitadelUser[], search?: string) =>
  layout(
    `<main class="container mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Usuários</h1>
        <a href="/users/new" class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors text-sm font-medium">
          + Novo Usuário
        </a>
      </div>

      <form method="get" action="/users" class="mb-6 flex gap-2">
        <input
          type="text" name="search" placeholder="Buscar por nome..."
          value="${esc(search ?? "")}"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button type="submit" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
          Buscar
        </button>
      </form>

      ${users.length === 0
        ? `<p class="text-gray-500">Nenhum usuário encontrado.</p>`
        : usersTable(users)}
    </main>`,
    session,
  );

const usersTable = (users: readonly ZitadelUser[]) => `
<div class="bg-white rounded-lg shadow overflow-hidden">
  <table class="w-full">
    <thead class="bg-gray-50">
      <tr>
        <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
        <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
        <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
        <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
        <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      ${users.map(userRow).join("")}
    </tbody>
  </table>
</div>`;

const userRow = (user: ZitadelUser) => {
  const name = user.human?.profile.displayName ?? user.username;
  const email = user.human?.email.email ?? "—";
  const canToggle = user.state === "USER_STATE_ACTIVE" || user.state === "USER_STATE_INACTIVE";
  const toggleLabel = user.state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar";

  return `
  <tr class="hover:bg-gray-50" id="user-${user.userId}">
    <td class="px-4 py-3">
      <a href="/users/${user.userId}" class="text-sky-600 hover:underline font-medium">${esc(name)}</a>
    </td>
    <td class="px-4 py-3 text-sm text-gray-600">${esc(email)}</td>
    <td class="px-4 py-3 text-sm text-gray-500">${esc(user.username)}</td>
    <td class="px-4 py-3">${badge(user.state)}</td>
    <td class="px-4 py-3 text-right">
      ${canToggle ? `<button hx-post="/users/${user.userId}/toggle" hx-target="#user-${user.userId}" hx-swap="outerHTML" class="text-xs text-gray-500 hover:text-gray-800 mr-3">${toggleLabel}</button>` : ""}
      <a href="/users/${user.userId}" class="text-xs text-sky-600 hover:underline">Detalhes</a>
    </td>
  </tr>`;
};

// Partial for HTMX swap after toggle
export const userRowPartial = (user: ZitadelUser) => userRow(user);
