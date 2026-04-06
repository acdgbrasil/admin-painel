// ─── Reactive Signals System ─────────────────────────────────
// Auto-tracking via global activeEffect stack.
// ~80 lines, zero dependencies.

type Listener = () => void;
type Unsubscribe = () => void;

// ─── Signal ──────────────────────────────────────────────────

export interface Signal<T> {
  readonly get: () => T;
  readonly set: (value: T | ((prev: T) => T)) => void;
  readonly subscribe: (listener: Listener) => Unsubscribe;
}

export interface Computed<T> {
  readonly get: () => T;
  readonly subscribe: (listener: Listener) => Unsubscribe;
}

// ─── Tracking context ────────────────────────────────────────

let activeEffect: Listener | null = null;

// ─── createSignal ────────────────────────────────────────────

export const createSignal = <T>(initial: T): Signal<T> => {
  let value = initial;
  const listeners = new Set<Listener>();

  const get = (): T => {
    if (activeEffect) listeners.add(activeEffect);
    return value;
  };

  const set = (next: T | ((prev: T) => T)): void => {
    const newValue = typeof next === "function"
      ? (next as (prev: T) => T)(value)
      : next;
    if (Object.is(value, newValue)) return;
    value = newValue;
    queueMicrotask(() => {
      for (const fn of listeners) fn();
    });
  };

  const subscribe = (listener: Listener): Unsubscribe => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };

  return { get, set, subscribe };
};

// ─── createEffect ────────────────────────────────────────────

export const createEffect = (fn: () => void): Unsubscribe => {
  const execute: Listener = () => {
    const prev = activeEffect;
    activeEffect = execute;
    try {
      fn();
    } finally {
      activeEffect = prev;
    }
  };
  execute();
  return () => { activeEffect = null; };
};

// ─── createComputed ──────────────────────────────────────────

export const createComputed = <T>(fn: () => T): Computed<T> => {
  const derived = createSignal<T>(undefined as T);
  createEffect(() => { derived.set(fn()); });
  return { get: derived.get, subscribe: derived.subscribe };
};
