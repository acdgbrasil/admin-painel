interface BadgeProps {
  readonly label: string;
  readonly bg: string;
  readonly color: string;
}

export const Badge = (props: BadgeProps): string => (
  <span
    class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
    style={`background:${props.bg};color:${props.color};`}
  >
    {props.label}
  </span>
) as unknown as string;
