import { esc } from "../helpers";

interface InputProps {
  readonly name: string;
  readonly type?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly required?: boolean;
  readonly pattern?: string;
  readonly maxLength?: number;
  readonly hasError?: boolean;
  readonly inputMode?: string;
  readonly autocomplete?: string;
  readonly id?: string;
}

const BASE_CLS = "w-full px-4 py-3 text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors";
const NORMAL_BORDER = "border-gray-300";
const ERROR_BORDER = "border-red-400 bg-red-50";

export const renderInput = (props: InputProps): string => {
  const borderCls = props.hasError ? ERROR_BORDER : NORMAL_BORDER;
  const attrs = [
    `type="${props.type ?? "text"}"`,
    `name="${esc(props.name)}"`,
    props.id ? `id="${esc(props.id)}"` : "",
    `class="${BASE_CLS} ${borderCls}"`,
    props.placeholder ? `placeholder="${esc(props.placeholder)}"` : "",
    props.value !== undefined ? `value="${esc(props.value)}"` : "",
    props.required ? "required" : "",
    props.pattern ? `pattern="${esc(props.pattern)}"` : "",
    props.maxLength ? `maxlength="${props.maxLength}"` : "",
    props.inputMode ? `inputmode="${esc(props.inputMode)}"` : "",
    props.autocomplete ? `autocomplete="${esc(props.autocomplete)}"` : "",
  ].filter(Boolean).join(" ");

  return `<input ${attrs} />`;
};
