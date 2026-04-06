import type { ViewModel } from "../core/router";
import { LoginPage } from "../view/pages/LoginPage";

export const createLoginViewModel = (): ViewModel => ({
  mount: (root) => { root.innerHTML = LoginPage(); },
  unmount: () => {},
});
