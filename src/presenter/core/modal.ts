// ─── Modal System ──────────────────────��─────────────────────

export interface ConfirmModalOptions {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly confirmVariant?: "danger" | "primary";
  readonly onConfirm: () => void | Promise<void>;
}

let activeModal: HTMLElement | null = null;

const closeModal = (): void => {
  activeModal?.remove();
  activeModal = null;
};

export const openModal = (html: string, width = "600px"): { readonly close: () => void } => {
  closeModal();
  const container = document.getElementById("modal-container");
  if (!container) return { close: closeModal };

  const el = document.createElement("div");
  el.className = "backdrop-enter fixed inset-0 z-40 flex items-center justify-center";
  el.style.cssText = "background:rgba(38,29,17,0.3);";
  el.innerHTML = `<div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width:${width};max-width:95vw;max-height:90vh;overflow-y:auto;" data-modal-content>${html}</div>`;

  el.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("[data-modal-content]")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); }, { once: true });

  container.appendChild(el);
  activeModal = el;
  return { close: closeModal };
};

export const openConfirmModal = (opts: ConfirmModalOptions): void => {
  const bg = opts.confirmVariant === "primary" ? "#4F8448" : "#A6290D";
  const iconBg = opts.confirmVariant === "primary" ? "rgba(79,132,72,0.1)" : "rgba(166,41,13,0.1)";
  const icon = opts.confirmVariant === "primary" ? "✓" : "⚠";

  const { close } = openModal(`
    <div class="p-8 text-center">
      <div class="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style="background:${iconBg}">
        <span class="text-2xl">${icon}</span>
      </div>
      <h3 class="text-lg font-bold mb-2" style="color:#261D11;">${opts.title}</h3>
      <p class="text-sm mb-6" style="color:rgba(38,29,17,0.5);">${opts.description}</p>
      <div class="flex gap-3 justify-center">
        <button data-modal-action="cancel" class="px-6 py-2.5 rounded-full text-sm font-medium" style="border:1.5px solid rgba(38,29,17,0.2);color:#261D11;">Cancelar</button>
        <button data-modal-action="confirm" class="px-6 py-2.5 rounded-full text-sm font-medium text-white" style="background:${bg};">${opts.confirmLabel ?? "Confirmar"}</button>
      </div>
    </div>
  `, "440px");

  activeModal?.addEventListener("click", async (e) => {
    const action = (e.target as HTMLElement).closest("[data-modal-action]")?.getAttribute("data-modal-action");
    if (action === "cancel") close();
    else if (action === "confirm") { await opts.onConfirm(); close(); }
  });
};
