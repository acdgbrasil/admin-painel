import { authenticatedLayout } from "../templates/authenticated";
import { renderSearchBar } from "../molecules/search-bar";
import { renderUserTable } from "../organisms/user-table";
import { renderLink } from "../atoms/link";
import type { UserRowProps } from "../molecules/user-row";
import type { SessionInfo } from "../../../data/model/session";

export interface UsersListPageState {
  readonly session: SessionInfo;
  readonly users: readonly UserRowProps[];
  readonly search: string;
  readonly loading: boolean;
  readonly error: string | null;
}

export const usersListPage = (state: UsersListPageState): string =>
  authenticatedLayout(state.session, `
    <main class="container mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Usuários</h1>
        ${renderLink({ href: "/users/new", label: "+ Novo Usuário", cls: "px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors text-sm font-medium" })}
      </div>

      ${renderSearchBar({ value: state.search, placeholder: "Buscar por nome..." })}

      ${state.loading
        ? `<p class="text-gray-500">Carregando...</p>`
        : state.error
          ? `<p class="text-red-500">${state.error}</p>`
          : state.users.length === 0
            ? `<p class="text-gray-500">Nenhum usuário encontrado.</p>`
            : renderUserTable(state.users)}
    </main>
  `);
