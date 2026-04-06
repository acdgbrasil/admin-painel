import { authenticatedLayout } from "../templates/authenticated";
import { renderUserInfoCard, type UserInfoCardProps } from "../organisms/user-info-card";
import { renderGrantList } from "../organisms/grant-list";
import { renderRolePicker, type RolePickerItem } from "../organisms/role-picker";
import { renderButton } from "../atoms/button";
import { renderLink } from "../atoms/link";
import { esc } from "../helpers";
import type { GrantItemProps } from "../molecules/grant-item";
import type { SessionInfo } from "../../../data/model/session";
import type { Project } from "../../../data/model/grant";

export interface UserDetailPageState {
  readonly session: SessionInfo;
  readonly user: UserInfoCardProps;
  readonly grants: readonly GrantItemProps[];
  readonly projects: readonly Project[];
  readonly roles: readonly RolePickerItem[];
  readonly loading: boolean;
  readonly error: string | null;
}

export const userDetailPage = (state: UserDetailPageState): string =>
  authenticatedLayout(state.session, `
    <main class="container mx-auto p-6 max-w-2xl">
      ${renderLink({ href: "/users", label: "← Voltar para Usuários", cls: "text-sm text-sky-600 hover:underline mb-4 inline-block" })}

      ${state.loading
        ? `<p class="text-gray-500">Carregando...</p>`
        : state.error
          ? `<p class="text-red-500">${state.error}</p>`
          : `
            ${renderUserInfoCard(state.user)}

            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-medium text-gray-700 mb-4">Roles</h2>
              <div id="grants-list">${renderGrantList(state.grants)}</div>

              <details class="mt-4">
                <summary class="text-sm text-sky-600 hover:underline cursor-pointer">+ Adicionar Role</summary>
                <form data-action="add-grant" class="mt-3 p-4 bg-sky-50 rounded-lg space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                    <select name="projectId" data-action="load-roles"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                      <option value="">Selecione...</option>
                      ${state.projects.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}
                    </select>
                  </div>
                  <div id="role-options">${renderRolePicker(state.roles)}</div>
                  ${renderButton({ label: "Adicionar", variant: "primary", type: "submit" })}
                </form>
              </details>
            </div>
          `}
    </main>
  `);
