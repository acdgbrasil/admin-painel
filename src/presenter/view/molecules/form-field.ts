import { esc } from "../helpers";

interface FormFieldProps {
  readonly label: string;
  readonly input: string;
  readonly hint?: string;
  readonly helper?: string;
  readonly error?: string;
  readonly required?: boolean;
}

export const renderFormField = (props: FormFieldProps): string => `
<div class="space-y-1">
  <label class="block text-base font-medium text-gray-800">
    ${esc(props.label)}
    ${props.required ? `<span class="text-red-500 ml-0.5">*</span>` : ""}
    ${props.hint ? `<span class="text-gray-400 font-normal text-sm ml-1">(${esc(props.hint)})</span>` : ""}
  </label>
  ${props.helper ? `<p class="text-sm text-gray-500">${esc(props.helper)}</p>` : ""}
  ${props.input}
  ${props.error ? `<p class="text-sm text-red-600 mt-1" role="alert">${esc(props.error)}</p>` : ""}
</div>`;
