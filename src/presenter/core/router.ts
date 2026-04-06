// ─── Client-Side Router (pushState) ──────────────────────────

export interface ViewModel {
  readonly mount: (root: HTMLElement) => void;
  readonly unmount: () => void;
}

type ViewModelFactory = (params: Readonly<Record<string, string>>) => ViewModel;

interface Route {
  readonly pattern: RegExp;
  readonly paramNames: readonly string[];
  readonly factory: ViewModelFactory;
}

export interface Router {
  readonly register: (path: string, factory: ViewModelFactory) => void;
  readonly navigate: (path: string) => void;
  readonly start: (root: HTMLElement) => void;
}

const toRegex = (path: string): { readonly pattern: RegExp; readonly paramNames: readonly string[] } => {
  const paramNames: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_, name: string) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${pattern}$`), paramNames };
};

export const createRouter = (): Router => {
  const routes: Route[] = [];
  let currentVm: ViewModel | null = null;
  let rootEl: HTMLElement | null = null;

  const resolve = (pathname: string): void => {
    if (currentVm) {
      currentVm.unmount();
      currentVm = null;
    }

    for (const route of routes) {
      const match = pathname.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1]!;
        });
        currentVm = route.factory(params);
        currentVm.mount(rootEl!);
        return;
      }
    }

    // Fallback: redirect to /users
    if (pathname !== "/users") {
      history.replaceState(null, "", "/users");
      resolve("/users");
    }
  };

  return {
    register: (path, factory) => {
      const { pattern, paramNames } = toRegex(path);
      routes.push({ pattern, paramNames, factory });
    },

    navigate: (path) => {
      history.pushState(null, "", path);
      resolve(path);
    },

    start: (root) => {
      rootEl = root;

      // Intercept link clicks for SPA navigation
      document.addEventListener("click", (e) => {
        const anchor = (e.target as HTMLElement).closest("a[href]");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("http") || href.startsWith("/auth")) return;
        e.preventDefault();
        history.pushState(null, "", href);
        resolve(href);
      });

      // Handle browser back/forward
      window.addEventListener("popstate", () => resolve(location.pathname));

      // Initial route
      resolve(location.pathname);
    },
  };
};
