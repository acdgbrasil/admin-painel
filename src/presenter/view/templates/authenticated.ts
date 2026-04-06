import { renderNavBar } from "../organisms/nav-bar";
import type { SessionInfo } from "../../../data/model/session";

export const authenticatedLayout = (session: SessionInfo, content: string): string =>
  `${renderNavBar(session)}${content}`;
