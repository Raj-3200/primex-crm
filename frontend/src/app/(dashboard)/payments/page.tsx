"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign, TrendingUp, CreditCard, Calendar, Plus,
  CheckCircle2, Search, Filter, Download, XCircle,
  Banknote, Smartphone, Building2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QueryError } from "@/components/ui/error-boundary";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "CASH" | "UPI" | "BANK" | "CHEQUE";

interface Payment {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  total_amount: number;
  status: string;
  completed_at: string | null;
  created_at: string;
}

// ─── Schema ──────────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  order_number: z.string().min(1, "Order number required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "UPI", "BANK", "CHEQUE"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  paid_date: z.string().min(1, "Payment date required"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

// ─── API ──────────────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

// ─── Method icons/styles ──────────────────────────────────────────────────────
const methodConfig: Record<PaymentMethod, { label: string; icon: React.ElementType; classes: string }> = {
  CASH: { label: "Cash", icon: Banknote, classes: "bg-green-50 text-green-700" },
  UPI: { label: "UPI", icon: Smartphone, classes: "bg-purple-50 text-purple-700" },
  BANK: { label: "Bank Transfer", icon: Building2, classes: "bg-blue-50 text-blue-700" },
  CHEQUE: { label: "Cheque", icon: FileText, classes: "bg-yellow-50 text-yellow-700" },
};

// ─── Record Payment Dialog ────────────────────────────────────────────────────
function RecordPaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "CASH",
      paid_date: new Date().toISOString().split("T")[0],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: PaymentForm) =>
      apiFetch("/api/payments/record", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment recorded successfully");
      reset();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Order Number *</Label>
              <Input {...register("order_number")} placeholder="PX-2024-0001" />
              {errors.order_number && <p className="text-xs text-destructive">{errors.order_number.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <Select defaultValue="CASH" onValueChange={(v) => setValue("method", v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(methodConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <cfg.icon className="h-4 w-4" />{cfg.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input type="date" {...register("paid_date")} />
              {errors.paid_date && <p className="text-xs text-destructive">{errors.paid_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reference / Transaction ID</Label>
            <Input {...register("reference_number")} placeholder="UPI ref, cheque no., etc." />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Any additional notes…" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiFetch<{ payments: Payment[]; stats: Record<string, number> }>("/api/payments"),
    staleTime: 1000 * 60 * 2,
  });

  const stats = data?.stats;
  const payments = data?.payments ?? [];

  const filtered = payments.filter((p) => {
    const matchSearch = !search
      || p.order_number.toLowerCase().includes(search.toLowerCase())
      || p.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const statCards = [
    {
      label: "Total Collected",
      value: formatCurrency(stats?.totalCollected ?? 0),
      sub: `${stats?.totalTransactions ?? 0} transactions`,
      icon: DollarSign, bg: "bg-orange-50", color: "text-orange-500",
    },
    {
      label: "This Month",
      value: formatCurrency(stats?.thisMonth ?? 0),
      sub: `${stats?.thisMonthTransactions ?? 0} this month`,
      icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-500",
    },
    {
      label: "Transactions",
      value: String(stats?.totalTransactions ?? 0),
      sub: "Completed orders",
      icon: CreditCard, bg: "bg-blue-50", color: "text-blue-500",
    },
    {
      label: "Monthly Avg",
      value: formatCurrency(
        stats?.totalTransactions
          ? (stats.totalCollected ?? 0) / Math.max((stats.totalTransactions ?? 1))
          : 0
      ),
      sub: "Per transaction",
      icon: Calendar, bg: "bg-violet-50", color: "text-violet-500",
    },
  ];

  const serviceColors: Record<string, string> = {
    SOLAR: "bg-yellow-50 text-yellow-700",
    TANK: "bg-blue-50 text-blue-700",
    COMBINED: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track revenue from completed service orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 hidden sm:flex">
            <Download className="h-4 w-4" />Export
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
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
              <Skeleton className="h-7 w-28 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Payment History</h2>
          <div className="flex-1" />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isError ? (
          <div className="p-6">
            <QueryError message="Failed to load payments" onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Completed orders will appear here as payment records.
            </p>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />Record First Payment
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-semibold text-orange-600">
                    #{p.order_number}
                  </TableCell>
                  <TableCell className="font-medium">{p.customer_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${serviceColors[p.service_type] ?? "bg-gray-50 text-gray-700"}`}>
                      {p.service_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-700">
                    {formatCurrency(Number(p.total_amount))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.completed_at ? formatDate(p.completed_at) : formatDate(p.created_at)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />Collected
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecordPaymentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
