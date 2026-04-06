import { layout } from "./layout";

export const loginPage = () =>
  layout(`
    <main class="flex flex-col items-center justify-center min-h-screen gap-6">
      <div class="text-center">
        <h1 class="text-3xl font-semibold text-gray-800">ACDG Admin</h1>
        <p class="text-gray-500 mt-2">Painel de gestão de usuários</p>
      </div>
      <a
        href="/auth/login"
        class="px-6 py-3 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors font-medium"
      >
        Entrar com Zitadel
      </a>
    </main>
  `);
