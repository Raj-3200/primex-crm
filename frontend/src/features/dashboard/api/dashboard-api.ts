import apiClient from "@/lib/api-client";
import type { DashboardData } from "@/features/dashboard/types";

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get("/dashboard");
  return data;
}
