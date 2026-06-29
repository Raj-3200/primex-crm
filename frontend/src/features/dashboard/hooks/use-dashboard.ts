"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboard-api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 60_000, // Auto-refresh every minute
    staleTime: 30_000,
  });
}
