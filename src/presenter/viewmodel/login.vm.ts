import type { ViewModel } from "../core/router";
import { loginPage } from "../view/pages/login.page";

export const createLoginViewModel = (): ViewModel => ({
  mount: (root) => {
    root.innerHTML = loginPage();
  },
  unmount: () => {},
});
