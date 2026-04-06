// ─── API Result (discriminated union) ────────────────────────

interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

interface ApiFailure {
  readonly ok: false;
  readonly status: number;
  readonly message: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export const apiSuccess = <T>(data: T): ApiResult<T> => ({ ok: true, data });
export const apiFailure = (status: number, message: string): ApiResult<never> => ({ ok: false, status, message });
