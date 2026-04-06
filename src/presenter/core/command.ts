// ─── Command Pattern ─────────────────────────────────────────
// Encapsulates async operations with observable state.
// Uses solid-js signals for reactivity.

import { createSignal } from "solid-js";
import type { Accessor } from "solid-js";
import type { ApiResult } from "../../data/model/result";

export interface Command<TInput = void, TOutput = void> {
  readonly execute: (input: TInput) => Promise<void>;
  readonly running: Accessor<boolean>;
  readonly result: Accessor<ApiResult<TOutput> | null>;
  readonly error: Accessor<string | null>;
  readonly completed: Accessor<boolean>;
}

export const createCommand = <TInput = void, TOutput = void>(
  fn: (input: TInput) => Promise<ApiResult<TOutput>>,
): Command<TInput, TOutput> => {
  const [running, setRunning] = createSignal(false);
  const [result, setResult] = createSignal<ApiResult<TOutput> | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [completed, setCompleted] = createSignal(false);

  const execute = async (input: TInput): Promise<void> => {
    if (running()) return;

    setRunning(true);
    setError(null);
    setCompleted(false);
    setResult(null);

    try {
      const res = await fn(input);
      setResult(res);
      if (!res.ok) {
        setError(res.message);
      }
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setRunning(false);
    }
  };

  return { execute, running, result, error, completed };
};
