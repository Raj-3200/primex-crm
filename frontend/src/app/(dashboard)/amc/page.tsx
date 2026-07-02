"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCcw, Plus, Search, Calendar, CheckCircle2,
  Clock, AlertCircle, TrendingUp, DollarSign, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { QueryError } from "@/components/ui/error-boundary";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AMCContract {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  scheduled_date: string | null;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
}

// ─── API ─────────────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

async function fetchAMC() {
  const res = await fetch("/api/amc", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load AMC contracts");
  return res.json();
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; classes: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", classes: "bg-yellow-50 text-yellow-700", icon: Clock },
  SCHEDULED: { label: "Scheduled", classes: "bg-blue-50 text-blue-700", icon: Calendar },
  IN_PROGRESS: { label: "In Progress", classes: "bg-purple-50 text-purple-700", icon: AlertCircle },
  COMPLETED: { label: "Completed", classes: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", classes: "bg-red-50 text-red-700", icon: AlertCircle },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AMCPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["amc"],
    queryFn: fetchAMC,
    staleTime: 1000 * 60 * 2,
  });

  const orders: AMCContract[] = data?.orders ?? [];
  const stats = data?.stats ?? {};

  const filtered = orders.filter((o) => {
    const matchSearch = !search
      || o.customer_name.toLowerCase().includes(search.toLowerCase())
      || o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statCards = [
    { label: "Total Contracts", value: stats.total ?? 0, icon: FileText, bg: "bg-orange-50", color: "text-orange-500" },
    { label: "Active", value: stats.pending ?? 0, icon: RefreshCcw, bg: "bg-blue-50", color: "text-blue-500" },
    { label: "Completed", value: stats.completed ?? 0, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-500" },
    { label: "Total Revenue", value: formatCurrency(stats.revenue ?? 0), icon: DollarSign, bg: "bg-purple-50", color: "text-purple-500", isText: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">AMC Contracts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Annual Maintenance Contracts — combined solar & tank cleaning</p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />New Contract
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`rounded-xl p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {card.isText ? card.value : card.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <div className="p-6"><QueryError message="Failed to load AMC contracts" onRetry={refetch} /></div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <RefreshCcw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No AMC contracts yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first annual maintenance contract.
            </p>
            <Link href="/orders/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />New Contract
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contract) => {
                const sc = statusConfig[contract.status] ?? statusConfig.PENDING;
                return (
                  <TableRow key={contract.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link href={`/orders/${contract.id}`} className="font-mono font-semibold text-orange-600 hover:underline">
                        #{contract.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{contract.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{contract.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {contract.customer_address}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(contract.total_amount))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contract.scheduled_date ? formatDate(contract.scheduled_date) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.classes}`}>
                        <sc.icon className="h-3 w-3" />{sc.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
