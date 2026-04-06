import { layout } from "./layout";

interface UserNewViewState {
  readonly userName: string;
  readonly userRoles: string;
  readonly error?: string;
}

export const userNewPage = (state: UserNewViewState): string =>
  layout(
    `<main class="container mx-auto p-6 max-w-lg">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6">Novo Usuário</h1>

      ${state.error ? `<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">${state.error}</div>` : ""}

      <form method="post" action="/users" class="bg-white rounded-lg shadow p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" name="firstName" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
            <input type="text" name="lastName" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Username <span class="text-gray-400 font-normal">(opcional, default: email)</span>
          </label>
          <input type="text" name="username" placeholder="usuario@email.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Senha inicial <span class="text-gray-400 font-normal">(opcional — Zitadel envia convite por email se vazio)</span>
          </label>
          <input type="password" name="password" placeholder="Deixe vazio para convite por email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div class="flex gap-3 pt-2">
          <button type="submit"
            class="px-4 py-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors text-sm font-medium">
            Criar Usuário
          </button>
          <a href="/users"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </main>`,
    { userName: state.userName, userRoles: state.userRoles },
  );
