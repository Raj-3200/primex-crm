"use client";
import { API_BASE } from "@/lib/backend";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { Sun, CheckCircle2, Clock, IndianRupee, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  status: string;
  scheduled_date: string | null;
  total_amount: number;
  customer_name: string;
  customer_address: string;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  revenue: number;
}

interface ApiResponse {
  orders: Order[];
  stats: Stats;
}

const statCards = (stats: Stats) => [
  {
    label: "Total Jobs",
    value: stats.total,
    icon: Sun,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    label: "Completed",
    value: stats.completed,
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    label: "Pending",
    value: stats.pending,
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    label: "Revenue",
    value: formatCurrency(stats.revenue),
    icon: IndianRupee,
    color: "text-blue-500",
    bg: "bg-blue-50",
    isString: true,
  },
];

export default function SolarPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["solar-orders"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/solar`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch solar orders");
      return res.json();
    },
    enabled: !!accessToken,
  });

  const orders = data?.orders ?? [];
  const stats: Stats = data?.stats ?? {
    total: 0,
    completed: 0,
    pending: 0,
    revenue: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Sun className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Solar Cleaning</h1>
          <p className="text-sm text-muted-foreground">
            Manage all solar panel cleaning jobs
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border shadow-sm p-6"
              >
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : statCards(stats).map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border shadow-sm p-6 flex items-center gap-4"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} flex-shrink-0`}
                >
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">
                    {card.isString ? card.value : card.value}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">All Solar Jobs</h2>

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load data. Please try again.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No solar jobs found"
            description="Solar cleaning orders will appear here once created."
            icon={Sun}
            iconClassName="text-orange-300"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium text-orange-600">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {order.customer_name ?? "—"}
                      </p>
                      {order.customer_address && (
                        <p className="text-xs text-muted-foreground">
                          {order.customer_address}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {order.scheduled_date
                      ? formatDate(order.scheduled_date)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
