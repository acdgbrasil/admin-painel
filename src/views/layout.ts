import type { Session } from "../auth";

export const layout = (content: string, session?: Session | null) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ACDG Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
</head>
<body class="bg-gray-100 min-h-screen" hx-boost="true">
  ${session ? nav(session) : ""}
  ${content}
</body>
</html>`;

const nav = (session: Session) => `
<nav class="bg-sky-800">
  <div class="container mx-auto flex items-center justify-between p-3 text-gray-200">
    <div class="flex items-center gap-1">
      <span class="font-semibold text-white mr-4">ACDG Admin</span>
      <ul class="flex items-center">
        <li class="border-b-2 border-sky-300 mx-1.5 sm:mx-4">
          <a href="/users">Usuários</a>
        </li>
      </ul>
    </div>
    <div class="flex items-center gap-4">
      <div class="text-sm text-right">
        <p class="text-white font-medium">${esc(session.name)}</p>
        <p class="text-sky-300 text-xs">${esc(session.roles.join(", "))}</p>
      </div>
      <a href="/auth/logout" class="px-3 py-1.5 text-sm bg-sky-700 hover:bg-sky-600 rounded transition-colors">
        Sair
      </a>
    </div>
  </div>
</nav>`;

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
