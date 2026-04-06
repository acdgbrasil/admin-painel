// ─── DOM Rendering + Event Delegation ────────────────────────
// Views use data-action and data-* attributes.
// A single delegated listener dispatches to ViewModel handlers.

export type ActionHandler = (target: HTMLElement, action: string) => void;

export interface RenderContext {
  readonly root: HTMLElement;
  readonly update: (html: string) => void;
  readonly onAction: (handler: ActionHandler) => void;
  readonly onSubmit: (handler: (form: HTMLFormElement, action: string) => void) => void;
  readonly destroy: () => void;
}

export const createRenderContext = (root: HTMLElement): RenderContext => {
  let lastHtml = "";
  let actionHandler: ActionHandler | null = null;
  let submitHandler: ((form: HTMLFormElement, action: string) => void) | null = null;

  // Click delegation
  const handleClick = (e: MouseEvent): void => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target || !actionHandler) return;

    const action = target.dataset["action"];
    if (!action) return;

    // Confirm dialog
    const confirmMsg = target.dataset["confirm"];
    if (confirmMsg && !confirm(confirmMsg)) return;

    actionHandler(target, action);
  };

  // Submit delegation
  const handleSubmit = (e: SubmitEvent): void => {
    const form = (e.target as HTMLElement).closest<HTMLFormElement>("form[data-action]");
    if (!form || !submitHandler) return;

    e.preventDefault();
    const action = form.dataset["action"];
    if (action) submitHandler(form, action);
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("submit", handleSubmit);

  return {
    root,

    update: (html) => {
      if (html === lastHtml) return;
      lastHtml = html;
      root.innerHTML = html;
    },

    onAction: (handler) => {
      actionHandler = handler;
    },

    onSubmit: (handler) => {
      submitHandler = handler;
    },

    destroy: () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("submit", handleSubmit);
      actionHandler = null;
      submitHandler = null;
    },
  };
};

// ─── Form data extraction ────────────────────────────────────

export const formToObject = (form: HTMLFormElement): Readonly<Record<string, string | readonly string[]>> => {
  const data = new FormData(form);
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of data.entries()) {
    const existing = result[key];
    if (existing !== undefined) {
      if (Array.isArray(existing)) {
        existing.push(String(value));
      } else {
        result[key] = [existing, String(value)];
      }
    } else {
      result[key] = String(value);
    }
  }

  return result;
};
