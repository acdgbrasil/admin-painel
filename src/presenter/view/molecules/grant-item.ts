import { esc } from "../helpers";
import { renderButton } from "../atoms/button";

export interface GrantItemProps {
  readonly id: string;
  readonly userId: string;
  readonly projectName: string;
  readonly roleKeys: readonly string[];
}

export const renderGrantItem = (props: GrantItemProps): string => `
<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg" id="grant-${props.id}">
  <div>
    <span class="font-medium text-sm text-gray-700">${esc(props.projectName)}</span>
    <span class="mx-2 text-gray-300">|</span>
    ${props.roleKeys.map((r) => `<span class="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-xs font-medium mr-1">${esc(r)}</span>`).join("")}
  </div>
  ${renderButton({
    label: "Remover",
    variant: "danger",
    action: "remove-grant",
    dataAttrs: { "grant-id": props.id, "user-id": props.userId, confirm: `Remover role ${props.roleKeys.join(", ")} do projeto ${props.projectName}?` },
  })}
</div>`;
