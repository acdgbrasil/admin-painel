import { useLocation } from "@solidjs/router";
import { authUser, logout, userRoles } from "~/lib/auth";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    location.pathname.startsWith(path) ? "border-sky-300" : "border-transparent hover:border-sky-300";

  const displayName = () => {
    const u = authUser();
    return u?.profile?.name ?? u?.profile?.preferred_username ?? "Admin";
  };

  return (
    <nav class="bg-sky-800">
      <div class="container mx-auto flex items-center justify-between p-3 text-gray-200">
        <div class="flex items-center gap-1">
          <span class="font-semibold text-white mr-4">ACDG Admin</span>
          <ul class="flex items-center">
            <li class={`border-b-2 ${active("/users")} mx-1.5 sm:mx-4`}>
              <a href="/users">Usuários</a>
            </li>
          </ul>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-sm text-right">
            <p class="text-white font-medium">{displayName()}</p>
            <p class="text-sky-300 text-xs">{userRoles().join(", ")}</p>
          </div>
          <button
            onClick={() => logout()}
            class="px-3 py-1.5 text-sm bg-sky-700 hover:bg-sky-600 rounded transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
