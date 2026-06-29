import type { DashboardData } from "@/features/dashboard/types";

export async function fetchDashboard(): Promise<DashboardData> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch("/api/dashboard", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    next: { revalidate: 30 }, // cache 30s in production
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load dashboard");
  }

  return res.json();
}
