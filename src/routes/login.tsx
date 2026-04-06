import { login } from "~/lib/auth";

export default function Login() {
  return (
    <main class="flex flex-col items-center justify-center min-h-screen gap-6">
      <div class="text-center">
        <h1 class="text-3xl font-semibold text-gray-800">ACDG Admin</h1>
        <p class="text-gray-500 mt-2">Painel de gestão de usuários</p>
      </div>
      <button
        onClick={() => login()}
        class="px-6 py-3 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium"
      >
        Entrar com Zitadel
      </button>
    </main>
  );
}
