import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

// All client-side API calls go through Next.js API routes (/api/*)
// which authenticate directly against Neon PostgreSQL
const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request: Attach JWT ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: Handle 401 — attempt token refresh ──────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || "";

    // 401 = JWT invalid/expired — attempt token refresh once
    if (status === 401 && !error.config?._retry) {
      error.config._retry = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refresh_token")
          : null;

      if (!refreshToken || detail === "Invalid or expired token") {
        // Genuine auth failure — clear and redirect
        if (typeof window !== "undefined") {
          useAuthStore.getState().clearAuth();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refresh_token: refreshToken,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(error.config);
      } catch {
        if (typeof window !== "undefined") {
          useAuthStore.getState().clearAuth();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
