import { esc } from "../helpers";

interface InputProps {
  readonly name: string;
  readonly type?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly required?: boolean;
  readonly pattern?: string;
  readonly maxLength?: number;
}

const BASE_CLS = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500";

export const renderInput = (props: InputProps): string => {
  const attrs = [
    `type="${props.type ?? "text"}"`,
    `name="${esc(props.name)}"`,
    `class="${BASE_CLS}"`,
    props.placeholder ? `placeholder="${esc(props.placeholder)}"` : "",
    props.value ? `value="${esc(props.value)}"` : "",
    props.required ? "required" : "",
    props.pattern ? `pattern="${esc(props.pattern)}"` : "",
    props.maxLength ? `maxlength="${props.maxLength}"` : "",
  ].filter(Boolean).join(" ");

  return `<input ${attrs} />`;
};
