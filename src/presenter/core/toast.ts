// ─── Toast Notification System ───────────────────────────────

type ToastType = "success" | "error" | "info";

const COLORS: Readonly<Record<ToastType, string>> = {
  success: "background:#4F8448;color:#FAF0E0;",
  error: "background:#A6290D;color:#FAF0E0;",
  info: "background:#172D48;color:#FAF0E0;",
};

export const showToast = (message: string, type: ToastType = "info"): void => {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const el = document.createElement("div");
  el.className = "toast-enter px-7 py-3 rounded-full text-sm font-medium shadow-lg whitespace-nowrap";
  el.style.cssText = COLORS[type];
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.className = el.className.replace("toast-enter", "toast-exit");
    setTimeout(() => el.remove(), 300);
  }, 3000);
};
