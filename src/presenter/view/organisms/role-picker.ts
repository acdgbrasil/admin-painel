import { esc } from "../helpers";

export interface RolePickerItem {
  readonly key: string;
  readonly label: string;
}

export const renderRolePicker = (roles: readonly RolePickerItem[]): string => {
  if (roles.length === 0) return `<p class="text-gray-400 text-sm">Nenhuma role disponível.</p>`;
  return `<div class="flex flex-wrap gap-2">
    ${roles.map((r) => `
      <label class="cursor-pointer">
        <input type="checkbox" name="roleKeys" value="${esc(r.key)}" class="hidden peer" />
        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 peer-checked:bg-sky-600 peer-checked:text-white transition-colors">
          ${esc(r.label)}
        </span>
      </label>`).join("")}
  </div>`;
};
