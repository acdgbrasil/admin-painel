type Variant = "primary" | "secondary" | "danger" | "outline";

const STYLES: Readonly<Record<Variant, string>> = {
  primary: "background:#4F8448;color:white;",
  secondary: "border:1.5px solid rgba(38,29,17,0.2);color:#261D11;",
  danger: "background:#A6290D;color:white;",
  outline: "border:1.5px solid rgba(38,29,17,0.2);color:rgba(38,29,17,0.6);",
};

interface ButtonProps {
  readonly label: string;
  readonly variant?: Variant;
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly "data-action"?: string;
  readonly "data-id"?: string;
  readonly class?: string;
}

export const Button = (props: ButtonProps): string => (
  <button
    type={props.type ?? "button"}
    data-action={props["data-action"]}
    data-id={props["data-id"]}
    disabled={props.disabled}
    class={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${props.class ?? ""}`}
    style={STYLES[props.variant ?? "primary"]}
  >
    {props.label}
  </button>
) as unknown as string;
