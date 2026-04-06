import { esc } from "../helpers";

interface FormFieldProps {
  readonly label: string;
  readonly input: string;
  readonly hint?: string;
}

export const renderFormField = (props: FormFieldProps): string => `
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">
    ${esc(props.label)}
    ${props.hint ? `<span class="text-gray-400 font-normal">(${esc(props.hint)})</span>` : ""}
  </label>
  ${props.input}
</div>`;
