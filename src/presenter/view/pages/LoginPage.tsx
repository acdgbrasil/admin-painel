export const LoginPage = (): string => (
  <main class="flex flex-col items-center justify-center min-h-screen gap-8" style="background:#F2E2C4;">
    <div class="text-center">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style="background:#172D48;">
        <span class="text-2xl font-bold" style="color:#F2E2C4;">CR</span>
      </div>
      <h1 class="text-3xl font-bold" style="color:#261D11;">Conecta Raros</h1>
      <p class="mt-2 text-base font-editorial italic" style="color:rgba(38,29,17,0.5);">Painel administrativo</p>
    </div>
    <a
      href="/auth/login"
      class="px-8 py-4 rounded-full text-base font-editorial italic font-medium text-white transition-all duration-200"
      style="background:#4F8448;"
    >
      Entrar com Zitadel
    </a>
  </main>
) as unknown as string;
