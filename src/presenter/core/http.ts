// ─── HTTP Client (fetch wrapper, credentials: same-origin) ──

import type { ApiResult } from "../../data/model/result";
import { apiSuccess, apiFailure } from "../../data/model/result";

export interface HttpClient {
  readonly get: <T>(path: string) => Promise<ApiResult<T>>;
  readonly post: <T>(path: string, body?: unknown) => Promise<ApiResult<T>>;
  readonly del: <T>(path: string) => Promise<ApiResult<T>>;
}

export const createHttpClient = (): HttpClient => {
  const request = async <T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> => {
    try {
      const options: RequestInit = {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(path, options);

      if (res.status === 401) {
        window.location.href = "/login";
        return apiFailure(401, "Unauthorized");
      }

      if (!res.ok) {
        const text = await res.text();
        return apiFailure(res.status, text);
      }

      if (res.status === 204 || res.headers.get("content-length") === "0") {
        return apiSuccess(null as T);
      }

      const data = (await res.json()) as T;
      return apiSuccess(data);
    } catch (err) {
      return apiFailure(0, err instanceof Error ? err.message : "Network error");
    }
  };

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
  };
};
