/**
 * PrimeX CRM — API Client (native fetch, no axios dependency)
 * Auto-attaches JWT, handles 401 refresh, redirects to login.
 */

import { useAuthStore } from "@/stores/auth-store";

const _backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
export const BASE_URL = _backendUrl ? `${_backendUrl}/api/v1` : "/api";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

async function refreshTokens(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const refreshUrl = _backendUrl
    ? `${_backendUrl}/api/v1/auth/refresh`
    : "/api/auth/refresh";

  try {
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retry = false
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !_retry) {
    const newToken = await refreshTokens();
    if (newToken) {
      return apiClient<T>(path, options, true);
    }
    if (typeof window !== "undefined") {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiGet  = <T>(path: string) => apiClient<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiClient<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiClient<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  apiClient<T>(path, { method: "DELETE" });

export default apiClient;
