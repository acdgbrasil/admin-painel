import { esc } from "../helpers";
import { renderButton } from "../atoms/button";

interface SearchBarProps {
  readonly value: string;
  readonly placeholder?: string;
}

export const renderSearchBar = (props: SearchBarProps): string => `
<form data-action="search" class="mb-6 flex gap-2">
  <input type="text" name="search" placeholder="${esc(props.placeholder ?? "Buscar...")}"
    value="${esc(props.value)}"
    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
  ${renderButton({ label: "Buscar", variant: "secondary", type: "submit" })}
</form>`;
