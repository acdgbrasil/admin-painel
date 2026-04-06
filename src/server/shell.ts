// ─── HTML Shell (SPA entry point) ────────────────────────────

export const renderShell = (): string => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conecta Raros — Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,300;1,500&display=swap" rel="stylesheet" />
  <style>
    @font-face {
      font-family: 'Satoshi';
      src: url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap') format('woff2');
      font-display: swap;
    }
    :root {
      --bg: #F2E2C4;
      --card: #FAF0E0;
      --text: #261D11;
      --text-sec: rgba(38,29,17,0.5);
      --text-light: rgba(38,29,17,0.4);
      --border: rgba(38,29,17,0.2);
      --divider: rgba(38,29,17,0.1);
      --hover-bg: rgba(38,29,17,0.06);
      --active-bg: rgba(38,29,17,0.09);
      --primary: #4F8448;
      --primary-hover: #6BA362;
      --error: #A6290D;
      --error-hover: #C4441F;
      --panel: #172D48;
    }
    * { font-family: 'Satoshi', system-ui, sans-serif; }
    body { background: var(--bg); color: var(--text); }
    .font-editorial { font-family: 'Playfair Display', serif; }

    /* Toast animation */
    @keyframes toast-in { from { transform: translateX(-50%) translateY(80px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
    @keyframes toast-out { from { opacity: 1; } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }
    .toast-enter { animation: toast-in 300ms ease forwards; }
    .toast-exit { animation: toast-out 300ms ease forwards; }

    /* Shake animation */
    @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
    .shake { animation: shake 400ms ease; }

    /* Modal backdrop */
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .backdrop-enter { animation: fade-in 200ms ease forwards; }

    /* Toggle */
    .toggle-track { width: 40px; height: 22px; border-radius: 11px; position: relative; cursor: pointer; transition: background 250ms cubic-bezier(0.4,0,0.2,1); }
    .toggle-thumb { width: 16px; height: 16px; border-radius: 50%; background: white; position: absolute; top: 3px; transition: left 250ms cubic-bezier(0.4,0,0.2,1); }
    .toggle-on { background: var(--primary); }
    .toggle-on .toggle-thumb { left: 21px; }
    .toggle-off { background: rgba(38,29,17,0.2); }
    .toggle-off .toggle-thumb { left: 3px; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(38,29,17,0.15); border-radius: 3px; }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { bg: '#F2E2C4', card: '#FAF0E0', text: '#261D11', panel: '#172D48', primary: '#4F8448', error: '#A6290D' },
          },
          fontFamily: {
            satoshi: ['Satoshi', 'system-ui', 'sans-serif'],
            editorial: ['Playfair Display', 'serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="min-h-screen">
  <div id="app"></div>
  <div id="toast-container" class="fixed bottom-6 left-1/2 z-50" style="transform:translateX(-50%)"></div>
  <div id="modal-container"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>`;
