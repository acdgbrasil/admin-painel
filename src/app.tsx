import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount, Show } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { authLoading, isAuthenticated, restoreSession } from "~/lib/auth";
import Nav from "~/components/Nav";
import "./app.css";

const PUBLIC_ROUTES = ["/login", "/callback"];

function RedirectTo(props: { path: string }) {
  const navigate = useNavigate();
  onMount(() => navigate(props.path, { replace: true }));
  return null;
}

function AuthGuard(props: { children: any }) {
  const location = useLocation();

  onMount(async () => {
    await restoreSession();
  });

  const isPublicRoute = () => PUBLIC_ROUTES.includes(location.pathname);
  const shouldRedirectToLogin = () => !authLoading() && !isAuthenticated() && !isPublicRoute();
  const shouldRedirectToHome = () => !authLoading() && isAuthenticated() && location.pathname === "/login";

  return (
    <Show
      when={!authLoading()}
      fallback={
        <main class="flex items-center justify-center min-h-screen">
          <p class="text-gray-500">Carregando...</p>
        </main>
      }
    >
      <Show when={!shouldRedirectToLogin()} fallback={<RedirectTo path="/login" />}>
        <Show when={!shouldRedirectToHome()} fallback={<RedirectTo path="/" />}>
          {props.children}
        </Show>
      </Show>
    </Show>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <AuthGuard>
          <Show when={isAuthenticated()}>
            <Nav />
          </Show>
          <Suspense>{props.children}</Suspense>
        </AuthGuard>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
