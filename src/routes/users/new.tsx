import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { createHumanUser, ZitadelApiError } from "~/lib/zitadel-api";

export default function NewUser() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await createHumanUser({
        username: username() || email(),
        profile: {
          firstName: firstName(),
          lastName: lastName(),
        },
        email: {
          email: email(),
          isVerified: false,
        },
        ...(password() && {
          password: {
            password: password(),
            changeRequired: true,
          },
        }),
      });

      navigate(`/users/${result.userId}`, { replace: true });
    } catch (err) {
      if (err instanceof ZitadelApiError) {
        setError(`Erro ${err.status}: ${err.body}`);
      } else {
        setError("Erro ao criar usuário");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main class="container mx-auto p-6 max-w-lg">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6">Novo Usuário</h1>

      {error() && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error()}
        </div>
      )}

      <form onSubmit={handleSubmit} class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              required
              value={firstName()}
              onInput={(e) => setFirstName(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
            <input
              type="text"
              required
              value={lastName()}
              onInput={(e) => setLastName(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Username <span class="text-gray-400 font-normal">(opcional, default: email)</span>
          </label>
          <input
            type="text"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            placeholder={email() || "usuario@email.com"}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Senha inicial <span class="text-gray-400 font-normal">(opcional — Zitadel envia convite por email se vazio)</span>
          </label>
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            placeholder="Deixe vazio para convite por email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting()}
            class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {submitting() ? "Criando..." : "Criar Usuário"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/users")}
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
