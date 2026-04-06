import { createResource, createSignal, Show, For } from "solid-js";
import { useParams, useNavigate, A } from "@solidjs/router";
import {
  getUser,
  listUserGrants,
  deleteUser,
  deactivateUser,
  reactivateUser,
  addUserGrant,
  removeUserGrant,
  listProjects,
  listProjectRoles,
  ZitadelApiError,
  type UserGrant,
  type ProjectRole,
} from "~/lib/zitadel-api";

const STATE_LABELS: Record<string, { label: string; class: string }> = {
  USER_STATE_ACTIVE: { label: "Ativo", class: "bg-green-100 text-green-800" },
  USER_STATE_INACTIVE: { label: "Inativo", class: "bg-gray-100 text-gray-600" },
  USER_STATE_LOCKED: { label: "Bloqueado", class: "bg-red-100 text-red-800" },
  USER_STATE_INITIAL: { label: "Inicial", class: "bg-yellow-100 text-yellow-800" },
};

export default function UserDetail() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [error, setError] = createSignal("");
  const [showRoleForm, setShowRoleForm] = createSignal(false);

  const [user, { refetch: refetchUser }] = createResource(
    () => params.id,
    async (id) => (await getUser(id)).user,
  );

  const [grants, { refetch: refetchGrants }] = createResource(
    () => params.id,
    async (id) => (await listUserGrants(id)).result ?? [],
  );

  // ─── Actions ─────────────────────────────────────────────

  const handleToggleState = async () => {
    setError("");
    try {
      const u = user();
      if (!u) return;
      if (u.state === "USER_STATE_ACTIVE") {
        await deactivateUser(u.userId);
      } else if (u.state === "USER_STATE_INACTIVE") {
        await reactivateUser(u.userId);
      }
      refetchUser();
    } catch (err) {
      setError(err instanceof ZitadelApiError ? err.body : "Erro ao alterar estado");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;
    setError("");
    try {
      await deleteUser(params.id);
      navigate("/users", { replace: true });
    } catch (err) {
      setError(err instanceof ZitadelApiError ? err.body : "Erro ao excluir usuário");
    }
  };

  const handleRemoveGrant = async (grant: UserGrant) => {
    if (!confirm(`Remover role "${grant.roleKeys.join(", ")}" do projeto "${grant.projectName}"?`)) return;
    setError("");
    try {
      await removeUserGrant(params.id, grant.id);
      refetchGrants();
    } catch (err) {
      setError(err instanceof ZitadelApiError ? err.body : "Erro ao remover role");
    }
  };

  return (
    <main class="container mx-auto p-6 max-w-2xl">
      <A href="/users" class="text-sm text-sky-600 hover:underline mb-4 inline-block">
        &larr; Voltar para Usuários
      </A>

      {error() && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error()}
        </div>
      )}

      <Show when={!user.loading && user()} fallback={<p class="text-gray-500">Carregando...</p>}>
        {(u) => {
          const badge = () => STATE_LABELS[u().state] ?? { label: u().state, class: "bg-gray-100" };
          return (
            <>
              {/* User Info */}
              <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex items-start justify-between">
                  <div>
                    <h1 class="text-2xl font-semibold text-gray-800">
                      {u().human?.profile.displayName ?? u().username}
                    </h1>
                    <p class="text-gray-500 mt-1">{u().human?.email.email}</p>
                    <p class="text-gray-400 text-sm mt-1">@{u().username}</p>
                  </div>
                  <span class={`px-2 py-0.5 rounded text-xs font-medium ${badge().class}`}>
                    {badge().label}
                  </span>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-400">ID:</span>
                    <span class="ml-2 text-gray-600 font-mono text-xs">{u().userId}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Criado em:</span>
                    <span class="ml-2 text-gray-600">
                      {new Date(u().details.creationDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <Show when={u().human?.phone?.phone}>
                    <div>
                      <span class="text-gray-400">Telefone:</span>
                      <span class="ml-2 text-gray-600">{u().human!.phone!.phone}</span>
                    </div>
                  </Show>
                  <div>
                    <span class="text-gray-400">Email verificado:</span>
                    <span class="ml-2 text-gray-600">
                      {u().human?.email.isVerified ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>

                <div class="mt-6 flex gap-3">
                  <Show when={u().state === "USER_STATE_ACTIVE" || u().state === "USER_STATE_INACTIVE"}>
                    <button
                      onClick={handleToggleState}
                      class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {u().state === "USER_STATE_ACTIVE" ? "Desativar" : "Ativar"}
                    </button>
                  </Show>
                  <button
                    onClick={handleDelete}
                    class="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {/* Roles / Grants */}
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-medium text-gray-700">Roles</h2>
                  <button
                    onClick={() => setShowRoleForm(!showRoleForm())}
                    class="text-sm text-sky-600 hover:underline"
                  >
                    {showRoleForm() ? "Cancelar" : "+ Adicionar Role"}
                  </button>
                </div>

                <Show when={showRoleForm()}>
                  <AddRoleForm
                    userId={params.id}
                    onAdded={() => {
                      setShowRoleForm(false);
                      refetchGrants();
                    }}
                    onError={setError}
                  />
                </Show>

                <Show
                  when={!grants.loading && grants()?.length}
                  fallback={
                    <Show when={!grants.loading}>
                      <p class="text-gray-400 text-sm">Nenhuma role atribuída.</p>
                    </Show>
                  }
                >
                  <div class="space-y-2">
                    <For each={grants()}>
                      {(grant) => (
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span class="font-medium text-sm text-gray-700">{grant.projectName}</span>
                            <span class="mx-2 text-gray-300">|</span>
                            <For each={grant.roleKeys}>
                              {(role) => (
                                <span class="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-xs font-medium mr-1">
                                  {role}
                                </span>
                              )}
                            </For>
                          </div>
                          <button
                            onClick={() => handleRemoveGrant(grant)}
                            class="text-xs text-red-500 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </>
          );
        }}
      </Show>
    </main>
  );
}

// ─── Add Role Form ───────────────────────────────────────────

function AddRoleForm(props: {
  userId: string;
  onAdded: () => void;
  onError: (msg: string) => void;
}) {
  const [projects] = createResource(async () => (await listProjects()).result ?? []);
  const [selectedProject, setSelectedProject] = createSignal("");
  const [roles] = createResource(selectedProject, async (projectId) => {
    if (!projectId) return [];
    return (await listProjectRoles(projectId)).result ?? [];
  });
  const [selectedRoles, setSelectedRoles] = createSignal<string[]>([]);
  const [submitting, setSubmitting] = createSignal(false);

  const toggleRole = (key: string) => {
    const current = selectedRoles();
    if (current.includes(key)) {
      setSelectedRoles(current.filter((r) => r !== key));
    } else {
      setSelectedRoles([...current, key]);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!selectedProject() || selectedRoles().length === 0) return;
    setSubmitting(true);
    try {
      await addUserGrant(props.userId, selectedProject(), selectedRoles());
      props.onAdded();
    } catch (err) {
      props.onError(err instanceof ZitadelApiError ? err.body : "Erro ao adicionar role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="mb-4 p-4 bg-sky-50 rounded-lg space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
        <select
          value={selectedProject()}
          onChange={(e) => {
            setSelectedProject(e.currentTarget.value);
            setSelectedRoles([]);
          }}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Selecione...</option>
          <For each={projects()}>
            {(p) => <option value={p.id}>{p.name}</option>}
          </For>
        </select>
      </div>

      <Show when={selectedProject() && roles()?.length}>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Roles</label>
          <div class="flex flex-wrap gap-2">
            <For each={roles()}>
              {(role: ProjectRole) => (
                <button
                  type="button"
                  onClick={() => toggleRole(role.key)}
                  class={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedRoles().includes(role.key)
                      ? "bg-sky-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {role.displayName || role.key}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <button
        type="submit"
        disabled={submitting() || !selectedProject() || selectedRoles().length === 0}
        class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {submitting() ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
