import { renderUserRow, type UserRowProps } from "../molecules/user-row";

export const renderUserTable = (users: readonly UserRowProps[]): string => `
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
      ${users.map(renderUserRow).join("")}
    </tbody>
  </table>
</div>`;
