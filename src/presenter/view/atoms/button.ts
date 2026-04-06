import { esc } from "../helpers";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  readonly label: string;
  readonly variant: ButtonVariant;
  readonly action?: string;
  readonly dataAttrs?: Readonly<Record<string, string>>;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
}

const VARIANT_CLS: Readonly<Record<ButtonVariant, string>> = {
  primary: "bg-sky-700 text-white hover:bg-sky-800",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
};

export const renderButton = (props: ButtonProps): string => {
  const data = props.action ? `data-action="${esc(props.action)}"` : "";
  const extra = props.dataAttrs
    ? Object.entries(props.dataAttrs).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")
    : "";
  return `<button type="${props.type ?? "button"}" ${data} ${extra}
    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${VARIANT_CLS[props.variant]}"
    ${props.disabled ? "disabled" : ""}>${esc(props.label)}</button>`;
};
