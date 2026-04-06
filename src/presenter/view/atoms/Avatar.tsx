interface AvatarProps {
  readonly name: string;
  readonly size?: "sm" | "md" | "lg";
}

const SIZES: Readonly<Record<string, string>> = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-16 h-16 text-xl",
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
};

export const Avatar = (props: AvatarProps): string => (
  <div
    class={`rounded-full flex items-center justify-center font-bold shrink-0 ${SIZES[props.size ?? "md"]}`}
    style="background:#172D48;color:#F2E2C4;"
  >
    {initials(props.name)}
  </div>
) as unknown as string;
