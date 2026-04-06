// ─── HTML Shell (SPA entry point) ────────────────────────────

export const renderShell = (): string => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ACDG Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="app"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>`;
