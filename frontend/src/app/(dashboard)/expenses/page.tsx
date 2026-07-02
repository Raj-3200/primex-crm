"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Receipt, Plus, Search, Pencil, Trash2,
  Car, Wrench, ShoppingCart, Users, Zap, MoreHorizontal,
  DollarSign, TrendingDown, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { apiFetch } from "@/lib/backend";

// ─── Types & constants ────────────────────────────────────────────────────────
type ExpenseCategory = "VEHICLE" | "EQUIPMENT" | "SUPPLIES" | "STAFF" | "UTILITIES" | "OTHER";

interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  reference: string | null;
  created_at: string;
}

const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ElementType; classes: string }> = {
  VEHICLE:   { label: "Vehicle",   icon: Car,         classes: "bg-blue-50 text-blue-700" },
  EQUIPMENT: { label: "Equipment", icon: Wrench,       classes: "bg-orange-50 text-orange-700" },
  SUPPLIES:  { label: "Supplies",  icon: ShoppingCart, classes: "bg-green-50 text-green-700" },
  STAFF:     { label: "Staff",     icon: Users,        classes: "bg-purple-50 text-purple-700" },
  UTILITIES: { label: "Utilities", icon: Zap,          classes: "bg-yellow-50 text-yellow-700" },
  OTHER:     { label: "Other",     icon: Receipt,      classes: "bg-gray-100 text-gray-700" },
};

// ─── Schema ──────────────────────────────────────────────────────────────────
const expenseSchema = z.object({
  category: z.enum(["VEHICLE", "EQUIPMENT", "SUPPLIES", "STAFF", "UTILITIES", "OTHER"]),
  description: z.string().min(3, "Description required"),
  amount: z.number().positive("Amount must be positive"),
  expense_date: z.string().min(1, "Date required"),
  reference: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

// ─── Expense Dialog ───────────────────────────────────────────────────────────
function ExpenseDialog({
  expense, open, onClose,
}: { expense?: Expense; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!expense;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          description: expense.description,
          amount: Number(expense.amount),
          expense_date: expense.expense_date.split("T")[0],
          reference: expense.reference ?? "",
        }
      : {
          category: "OTHER",
          expense_date: new Date().toISOString().split("T")[0],
        },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ExpenseForm) =>
      apiFetch(isEdit ? `/expenses/${expense!.id}` : "/expenses", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(isEdit ? "Expense updated" : "Expense recorded");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Record Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select defaultValue={watch("category")} onValueChange={(v) => setValue("category", v as ExpenseCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([key, cfg]) => (
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
            <Label>Description *</Label>
            <Textarea {...register("description")} placeholder="What was this expense for?" rows={2} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number" step="0.01" className="pl-7" placeholder="0.00"
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register("expense_date")} />
              {errors.expense_date && <p className="text-xs text-destructive">{errors.expense_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reference / Bill No.</Label>
            <Input {...register("reference")} placeholder="Receipt, invoice, or bill number" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Record expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiFetch<{ expenses?: Expense[]; summary?: Record<string, number> }>("/expenses"),
    staleTime: 60_000,
  });

  const { mutate: deleteExpense, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => apiFetch(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const expenses: Expense[] = data?.expenses ?? [];
  const summary = data?.summary ?? {};

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalAmount = filtered.reduce((acc, e) => acc + Number(e.amount), 0);

  const statCards = [
    { label: "Total Expenses", value: formatCurrency(summary.total ?? 0), icon: TrendingDown, bg: "bg-red-50", color: "text-red-500" },
    { label: "This Month", value: formatCurrency(summary.this_month ?? 0), icon: Calendar, bg: "bg-orange-50", color: "text-orange-500" },
    { label: "Transactions", value: String(expenses.length), icon: Receipt, bg: "bg-blue-50", color: "text-blue-500" },
    { label: "Avg per Entry", value: formatCurrency(expenses.length ? (summary.total ?? 0) / expenses.length : 0), icon: DollarSign, bg: "bg-purple-50", color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track operational costs and business expenses</p>
        </div>
        <Button onClick={() => { setEditingExpense(undefined); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />Record Expense
        </Button>
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
            {isLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered.length > 0 && (
            <p className="text-sm text-muted-foreground ml-auto whitespace-nowrap">
              Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
            </p>
          )}
        </div>

        {isError ? (
          <div className="p-6"><QueryError message="Failed to load expenses" onRetry={refetch} /></div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No expenses recorded</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {search ? `No results for "${search}"` : "Start tracking your business expenses."}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />Record First Expense
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exp) => {
                const cc = categoryConfig[exp.category] ?? categoryConfig.OTHER;
                return (
                  <TableRow key={exp.id} className="hover:bg-muted/30">
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cc.classes}`}>
                        <cc.icon className="h-3 w-3" />{cc.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-56 truncate">{exp.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{exp.reference || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(exp.expense_date)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(Number(exp.amount))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingExpense(exp); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteId(exp.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      <ExpenseDialog
        expense={editingExpense}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingExpense(undefined); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteExpense(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
