import { esc } from "../helpers";

interface LinkProps {
  readonly href: string;
  readonly label: string;
  readonly cls?: string;
}

export const renderLink = (props: LinkProps): string =>
  `<a href="${esc(props.href)}" class="${props.cls ?? "text-sky-600 hover:underline"}">${esc(props.label)}</a>`;
