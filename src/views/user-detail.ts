import type { Session } from "../auth";
import type { ZitadelUser, UserGrant } from "../zitadel";
import { layout, esc } from "./layout";

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  USER_STATE_ACTIVE: { label: "Ativo", cls: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", cls: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", cls: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", cls: "bg-yellow-100 text-yellow-800" },
};

export const userDetailPage = (session: Session, user: ZitadelUser, grants: readonly UserGrant[], projects: readonly { readonly id: string; readonly name: string }[]) => {
  const badge = STATE_LABELS[user.state] ?? { label: user.state, cls: "bg-gray-100" };
  const canToggle = user.state === "USER_STATE_ACTIVE" || user.state === "USER_STATE_INACTIVE";

  return layout(
    `<main class="container mx-auto p-6 max-w-2xl">
      <a href="/users" class="text-sm text-sky-600 hover:underline mb-4 inline-block">&larr; Voltar para Usuários</a>

      <div id="user-error"></div>

      <!-- User Info -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-800">
              ${esc(user.human?.profile.displayName ?? user.username)}
            </h1>
            <p class="text-gray-500 mt-1">${esc(user.human?.email.email ?? "")}</p>
            <p class="text-gray-400 text-sm mt-1">@${esc(user.username)}</p>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-medium ${badge.cls}">${badge.label}</span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">ID:</span>
            <span class="ml-2 text-gray-600 font-mono text-xs">${user.userId}</span>
          </div>
          <div>
            <span class="text-gray-400">Criado em:</span>
            <span class="ml-2 text-gray-600">${new Date(user.details.creationDate).toLocaleDateString("pt-BR")}</span>
          </div>
          ${user.human?.phone?.phone ? `<div><span class="text-gray-400">Telefone:</span><span class="ml-2 text-gray-600">${esc(user.human.phone.phone)}</span></div>` : ""}
          <div>
            <span class="text-gray-400">Email verificado:</span>
            <span class="ml-2 text-gray-600">${user.human?.email.isVerified ? "Sim" : "Não"}</span>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          ${canToggle ? `<button hx-post="/users/${user.userId}/toggle" hx-target="body" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">${user.state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar"}</button>` : ""}
          <button hx-delete="/users/${user.userId}" hx-confirm="Tem certeza que deseja excluir este usuário? Esta ação é irreversível." hx-target="body" class="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors">
            Excluir
          </button>
        </div>
      </div>

      <!-- Roles / Grants -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-700">Roles</h2>
        </div>

        <div id="grants-list">
          ${grantsSection(user.userId, grants)}
        </div>

        <!-- Add Role Form -->
        <details class="mt-4">
          <summary class="text-sm text-sky-600 hover:underline cursor-pointer">+ Adicionar Role</summary>
          <form hx-post="/users/${user.userId}/grants" hx-target="#grants-list" hx-swap="innerHTML" class="mt-3 p-4 bg-sky-50 rounded-lg space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
              <select name="projectId"
                hx-get="" hx-trigger="change" hx-target="#role-options" hx-swap="innerHTML"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                _="on change set my.getAttribute('hx-get') to '/api/projects/' + my.value + '/roles' then htmx.process(me)">
                <option value="">Selecione...</option>
                ${projects.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}
              </select>
            </div>
            <div id="role-options"></div>
            <button type="submit" class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 text-sm font-medium transition-colors">
              Adicionar
            </button>
          </form>
        </details>
      </div>
    </main>`,
    session,
  );
};

const grantsSection = (userId: string, grants: readonly UserGrant[]) => {
  if (grants.length === 0) return `<p class="text-gray-400 text-sm">Nenhuma role atribuída.</p>`;

  return `<div class="space-y-2">
    ${grants
      .map(
        (grant) => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" id="grant-${grant.id}">
        <div>
          <span class="font-medium text-sm text-gray-700">${esc(grant.projectName)}</span>
          <span class="mx-2 text-gray-300">|</span>
          ${grant.roleKeys.map((r) => `<span class="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-xs font-medium mr-1">${esc(r)}</span>`).join("")}
        </div>
        <button
          hx-delete="/users/${userId}/grants/${grant.id}"
          hx-target="#grant-${grant.id}"
          hx-swap="outerHTML"
          hx-confirm="Remover role ${esc(grant.roleKeys.join(", "))} do projeto ${esc(grant.projectName)}?"
          class="text-xs text-red-500 hover:text-red-700">
          Remover
        </button>
      </div>`,
      )
      .join("")}
  </div>`;
};

// Partial for HTMX swap after grant add
export const grantsPartial = (userId: string, grants: readonly UserGrant[]) => grantsSection(userId, grants);

// Partial for role options loaded via HTMX
export const roleOptionsPartial = (roles: readonly { readonly key: string; readonly displayName: string }[]) => {
  if (roles.length === 0) return `<p class="text-gray-400 text-sm">Nenhuma role disponível.</p>`;
  return `<div class="flex flex-wrap gap-2">
    ${roles
      .map(
        (r) => `
      <label class="cursor-pointer">
        <input type="checkbox" name="roleKeys" value="${esc(r.key)}" class="hidden peer" />
        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 peer-checked:bg-sky-600 peer-checked:text-white transition-colors">
          ${esc(r.displayName || r.key)}
        </span>
      </label>`,
      )
      .join("")}
  </div>`;
};
