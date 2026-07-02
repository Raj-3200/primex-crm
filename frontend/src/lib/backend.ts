/**
 * PrimeX CRM — Backend API Helper
 *
 * Smart fallback:
 * - If NEXT_PUBLIC_BACKEND_URL is set → calls FastAPI on Render (/api/v1/*)
 * - If not set → falls back to built-in Next.js API routes (/api/*)
 *
 * This means the app works on Vercel immediately, even before the
 * Render backend is deployed. Just add NEXT_PUBLIC_BACKEND_URL later
 * to switch to the FastAPI backend.
 */

const BACKEND_URL =
  typeof window !== "undefined"
    ? undefined // resolved client-side from env below
    : undefined;

const _backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Base URL for all API calls.
 * - With backend:    https://primex-backend.onrender.com/api/v1
 * - Without backend: /api  (Next.js built-in routes)
 */
export const API_BASE = _backendUrl ? `${_backendUrl}/api/v1` : "/api";

/**
 * Auth base URL.
 * - With backend:    https://primex-backend.onrender.com/api/v1/auth
 * - Without backend: /api/auth
 */
export const AUTH_BASE = _backendUrl
  ? `${_backendUrl}/api/v1/auth`
  : "/api/auth";

/** Get stored access token */
export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

/** Standard auth headers */
export function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Fetch wrapper — throws on non-2xx with proper error message */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: "DELETE" });
