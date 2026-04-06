import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 class="text-4xl font-semibold text-gray-700">404</h1>
      <p class="text-gray-500">Página não encontrada</p>
      <A href="/" class="text-sky-600 hover:underline">
        Voltar ao início
      </A>
    </main>
  );
}
