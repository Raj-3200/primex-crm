"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, ShieldCheck, Briefcase, Wrench,
  Plus, Pencil, UserX, UserCheck, Search,
  MoreHorizontal, Mail, Phone, ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueryError } from "@/components/ui/error-boundary";
import { formatDate } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "MANAGER" | "TECHNICIAN";

interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]),
  password: z.string().min(8, "Minimum 8 characters").optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

// ─── API helpers ────────────────────────────────────────────────────────────

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

// ─── Styles ─────────────────────────────────────────────────────────────────

const roleConfig: Record<Role, { label: string; classes: string; Icon: React.ElementType }> = {
  ADMIN: { label: "Admin", classes: "bg-red-50 text-red-700 border-red-200", Icon: ShieldCheck },
  MANAGER: { label: "Manager", classes: "bg-blue-50 text-blue-700 border-blue-200", Icon: Briefcase },
  TECHNICIAN: { label: "Technician", classes: "bg-green-50 text-green-700 border-green-200", Icon: Wrench },
};

// ─── Employee Dialog ─────────────────────────────────────────────────────────

function EmployeeDialog({
  employee,
  open,
  onClose,
}: {
  employee?: Employee;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!employee;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? { full_name: employee.full_name, email: employee.email, phone: employee.phone ?? "", role: employee.role }
      : { role: "TECHNICIAN" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmployeeForm) =>
      apiFetch(isEdit ? `/api/employees/${employee!.id}` : "/api/employees", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success(isEdit ? "Employee updated" : "Employee added");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input {...register("full_name")} placeholder="John Doe" />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input {...register("email")} type="email" placeholder="john@primex.com" disabled={isEdit} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select defaultValue={watch("role")} onValueChange={(v) => setValue("role", v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TECHNICIAN">Technician</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input {...register("password")} type="password" placeholder="Min 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: () => apiFetch<{ employees: Employee[]; stats: Record<string, number> }>("/api/employees"),
    staleTime: 1000 * 60 * 2,
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch(`/api/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const employees = data?.employees ?? [];
  const stats = data?.stats ?? {};

  const filtered = employees.filter((e) => {
    const matchSearch = !search
      || e.full_name.toLowerCase().includes(search.toLowerCase())
      || e.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  const statCards = [
    { label: "Total Staff", value: stats.total ?? 0, icon: Users, bg: "bg-orange-50", color: "text-orange-500" },
    { label: "Admins", value: stats.admins ?? 0, icon: ShieldCheck, bg: "bg-red-50", color: "text-red-500" },
    { label: "Managers", value: stats.managers ?? 0, icon: Briefcase, bg: "bg-blue-50", color: "text-blue-500" },
    { label: "Technicians", value: stats.technicians ?? 0, icon: Wrench, bg: "bg-green-50", color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your team members and their roles</p>
        </div>
        <Button onClick={() => { setEditingEmployee(undefined); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
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
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="TECHNICIAN">Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isError ? (
          <div className="p-6">
            <QueryError message="Failed to load employees" onRetry={refetch} />
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No employees found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {search ? `No results for "${search}"` : "Add your first team member to get started."}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => {
                const rc = roleConfig[emp.role];
                return (
                  <TableRow key={emp.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold text-sm flex-shrink-0">
                          {emp.full_name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{emp.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />{emp.email}
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />{emp.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${rc.classes}`}>
                        <rc.Icon className="h-3 w-3" />{rc.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.is_active ? "default" : "secondary"} className={emp.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(emp.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingEmployee(emp); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleActive({ id: emp.id, is_active: !emp.is_active })}
                            className={emp.is_active ? "text-destructive" : "text-emerald-600"}
                          >
                            {emp.is_active ? (
                              <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-2" />Activate</>
                            )}
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

      {/* Dialog */}
      <EmployeeDialog
        employee={editingEmployee}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingEmployee(undefined); }}
      />
    </div>
  );
}
