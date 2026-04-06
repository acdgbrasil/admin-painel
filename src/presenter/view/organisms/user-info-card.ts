import { esc } from "../helpers";
import { renderBadge } from "../atoms/badge";
import { renderButton } from "../atoms/button";
import type { StateBadge } from "../../../data/model/user";

export interface UserInfoCardProps {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly phone: string | null;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly badge: StateBadge;
  readonly canToggle: boolean;
  readonly toggleLabel: string;
}

export const renderUserInfoCard = (props: UserInfoCardProps): string => `
<div class="bg-white rounded-lg shadow p-6 mb-6">
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-gray-800">${esc(props.displayName)}</h1>
      <p class="text-gray-500 mt-1">${esc(props.email)}</p>
      <p class="text-gray-400 text-sm mt-1">@${esc(props.username)}</p>
    </div>
    ${renderBadge(props.badge)}
  </div>

  <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
    <div><span class="text-gray-400">ID:</span><span class="ml-2 text-gray-600 font-mono text-xs">${props.userId}</span></div>
    <div><span class="text-gray-400">Criado em:</span><span class="ml-2 text-gray-600">${esc(props.createdAt)}</span></div>
    ${props.phone ? `<div><span class="text-gray-400">Telefone:</span><span class="ml-2 text-gray-600">${esc(props.phone)}</span></div>` : ""}
    <div><span class="text-gray-400">Email verificado:</span><span class="ml-2 text-gray-600">${props.emailVerified ? "Sim" : "Não"}</span></div>
  </div>

  <div class="mt-6 flex gap-3">
    ${props.canToggle ? renderButton({ label: props.toggleLabel, variant: "secondary", action: "toggle" }) : ""}
    ${renderButton({ label: "Excluir", variant: "danger", action: "delete", dataAttrs: { confirm: "Tem certeza que deseja excluir este usuário? Esta ação é irreversível." } })}
  </div>
</div>`;
