interface BadgeProps {
  readonly label: string;
  readonly cls: string;
}

export const renderBadge = (props: BadgeProps): string =>
  `<span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${props.cls}">${props.label}</span>`;
