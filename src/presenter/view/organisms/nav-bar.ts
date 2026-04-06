import { esc } from "../helpers";
import type { SessionInfo } from "../../../data/model/session";

export const renderNavBar = (session: SessionInfo): string => `
<nav class="bg-sky-800">
  <div class="container mx-auto flex items-center justify-between p-3 text-gray-200">
    <div class="flex items-center gap-1">
      <span class="font-semibold text-white mr-4">ACDG Admin</span>
      <ul class="flex items-center">
        <li class="border-b-2 border-sky-300 mx-1.5 sm:mx-4">
          <a href="/users">Usuários</a>
        </li>
      </ul>
    </div>
    <div class="flex items-center gap-4">
      <div class="text-sm text-right">
        <p class="text-white font-medium">${esc(session.name)}</p>
        <p class="text-sky-300 text-xs">${esc(session.roles.join(", "))}</p>
      </div>
      <a href="/auth/logout" class="px-3 py-1.5 text-sm bg-sky-700 hover:bg-sky-600 rounded transition-colors">Sair</a>
    </div>
  </div>
</nav>`;
