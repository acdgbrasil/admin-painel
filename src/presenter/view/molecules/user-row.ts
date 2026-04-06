import { esc } from "../helpers";
import { renderBadge } from "../atoms/badge";
import { renderButton } from "../atoms/button";
import { renderLink } from "../atoms/link";
import type { StateBadge } from "../../../data/model/user";

export interface UserRowProps {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly badge: StateBadge;
  readonly canToggle: boolean;
  readonly toggleLabel: string;
}

export const renderUserRow = (props: UserRowProps): string => `
<tr class="hover:bg-gray-50" id="user-${props.userId}">
  <td class="px-4 py-3">
    ${renderLink({ href: `/users/${props.userId}`, label: props.displayName, cls: "text-sky-600 hover:underline font-medium" })}
  </td>
  <td class="px-4 py-3 text-sm text-gray-600">${esc(props.email)}</td>
  <td class="px-4 py-3 text-sm text-gray-500">${esc(props.username)}</td>
  <td class="px-4 py-3">${renderBadge(props.badge)}</td>
  <td class="px-4 py-3 text-right">
    ${props.canToggle ? renderButton({ label: props.toggleLabel, variant: "secondary", action: "toggle", dataAttrs: { "user-id": props.userId } }) : ""}
    ${renderLink({ href: `/users/${props.userId}`, label: "Detalhes", cls: "text-xs text-sky-600 hover:underline ml-2" })}
  </td>
</tr>`;
