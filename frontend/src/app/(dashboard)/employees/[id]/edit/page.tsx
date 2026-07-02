"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load employee");
      const data = await res.json();
      return data.employees?.find((e: any) => e.id === id);
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: employee ? {
      full_name: employee.full_name || "",
      phone: employee.phone || "",
      role: employee.role || "TECHNICIAN",
      is_active: employee.is_active ?? true,
    } : undefined,
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      router.push("/employees");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href="/employees">Back to Employees</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/employees"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Employee</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{employee.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => update(v))} className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Personal Information</h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full Name *</Label>
                <Input {...register("full_name")} className={errors.full_name ? "border-destructive rounded-xl" : "rounded-xl"} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Phone Number</Label>
                <Input {...register("phone")} className="rounded-xl" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Role & Status</h2>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={watch("role")} onValueChange={(v) => setValue("role", v as FormValues["role"])}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin — Full access</SelectItem>
                    <SelectItem value="MANAGER">Manager — Manage orders & customers</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician — View assigned jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium text-sm">Account Active</p>
                  <p className="text-xs text-muted-foreground">Inactive accounts cannot log in</p>
                </div>
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(v) => setValue("is_active", v)}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/employees">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="shadow-premium rounded-xl">
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
