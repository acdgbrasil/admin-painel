// ─── Users List View ─────────────────────────────────────────
// Pure function: ViewState → HTML. Never imports Model.

import type { UsersListViewState, UserRow } from "../viewmodel/users";
import { layout, esc } from "./layout";

export const usersPage = (state: UsersListViewState): string =>
  layout(
    `<main class="container mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Usuários</h1>
        <a href="/users/new" class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors text-sm font-medium">
          + Novo Usuário
        </a>
      </div>

      <form method="get" action="/users" class="mb-6 flex gap-2">
        <input type="text" name="search" placeholder="Buscar por nome..."
          value="${esc(state.search)}"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        <button type="submit" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
          Buscar
        </button>
      </form>

      ${state.isEmpty
        ? `<p class="text-gray-500">Nenhum usuário encontrado.</p>`
        : renderTable(state.users)}
    </main>`,
    { userName: state.userName, userRoles: state.userRoles },
  );

const renderTable = (users: readonly UserRow[]): string => `
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
      ${users.map(renderRow).join("")}
    </tbody>
  </table>
</div>`;

const renderRow = (row: UserRow): string => `
<tr class="hover:bg-gray-50" id="user-${row.userId}">
  <td class="px-4 py-3">
    <a href="/users/${row.userId}" class="text-sky-600 hover:underline font-medium">${esc(row.displayName)}</a>
  </td>
  <td class="px-4 py-3 text-sm text-gray-600">${esc(row.email)}</td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc(row.username)}</td>
  <td class="px-4 py-3">
    <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${row.badge.cls}">${row.badge.label}</span>
  </td>
  <td class="px-4 py-3 text-right">
    ${row.canToggle ? `<button hx-post="/users/${row.userId}/toggle" hx-target="#user-${row.userId}" hx-swap="outerHTML" class="text-xs text-gray-500 hover:text-gray-800 mr-3">${row.toggleLabel}</button>` : ""}
    <a href="/users/${row.userId}" class="text-xs text-sky-600 hover:underline">Detalhes</a>
  </td>
</tr>`;

export const userRowPartial = (row: UserRow): string => renderRow(row);
