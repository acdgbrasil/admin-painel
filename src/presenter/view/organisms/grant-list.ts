import { renderGrantItem, type GrantItemProps } from "../molecules/grant-item";

export const renderGrantList = (grants: readonly GrantItemProps[]): string => {
  if (grants.length === 0) return `<p class="text-gray-400 text-sm">Nenhuma role atribuída.</p>`;
  return `<div class="space-y-2">${grants.map(renderGrantItem).join("")}</div>`;
};
