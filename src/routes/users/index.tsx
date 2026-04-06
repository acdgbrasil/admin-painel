import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { listUsers, deactivateUser, reactivateUser, type ZitadelUser } from "~/lib/zitadel-api";

const STATE_LABELS: Record<string, { label: string; class: string }> = {
  USER_STATE_ACTIVE: { label: "Ativo", class: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", class: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", class: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", class: "bg-yellow-100 text-yellow-800" },
};

const stateBadge = (state: string) => STATE_LABELS[state] ?? { label: state, class: "bg-gray-100 text-gray-600" };

export default function Users() {
  const [search, setSearch] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");

  const [users, { refetch }] = createResource(searchQuery, async (q) => {
    const res = await listUsers({ search: q || undefined, limit: 50 });
    return res.result ?? [];
  });

  const handleSearch = (e: Event) => {
    e.preventDefault();
    setSearchQuery(search());
  };

  const toggleUserState = async (user: ZitadelUser) => {
    if (user.state === "USER_STATE_ACTIVE") {
      await deactivateUser(user.userId);
    } else if (user.state === "USER_STATE_INACTIVE") {
      await reactivateUser(user.userId);
    }
    refetch();
  };

  return (
    <main class="container mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Usuários</h1>
        <A
          href="/users/new"
          class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors text-sm font-medium"
        >
          + Novo Usuário
        </A>
      </div>

      <form onSubmit={handleSearch} class="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          Buscar
        </button>
      </form>

      <Show when={!users.loading} fallback={<p class="text-gray-500">Carregando...</p>}>
        <Show when={users()?.length} fallback={<p class="text-gray-500">Nenhum usuário encontrado.</p>}>
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <For each={users()}>
                  {(user) => {
                    const badge = () => stateBadge(user.state);
                    return (
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                          <A href={`/users/${user.userId}`} class="text-sky-600 hover:underline font-medium">
                            {user.human?.profile.displayName ?? user.username}
                          </A>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-600">
                          {user.human?.email.email ?? "—"}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">{user.username}</td>
                        <td class="px-4 py-3">
                          <span class={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge().class}`}>
                            {badge().label}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <Show when={user.state === "USER_STATE_ACTIVE" || user.state === "USER_STATE_INACTIVE"}>
                            <button
                              onClick={() => toggleUserState(user)}
                              class="text-xs text-gray-500 hover:text-gray-800 mr-3"
                            >
                              {user.state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar"}
                            </button>
                          </Show>
                          <A href={`/users/${user.userId}`} class="text-xs text-sky-600 hover:underline">
                            Detalhes
                          </A>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </main>
  );
}
