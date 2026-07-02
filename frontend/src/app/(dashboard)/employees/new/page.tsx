"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormValues = z.infer<typeof schema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "TECHNICIAN" },
  });

  const { mutate: create, isPending, error: mutationError } = useMutation({
    mutationFn: async (values: FormValues) => {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          role: values.role,
          password: values.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/employees");
    },
  });

  const onSubmit = (values: FormValues) => create(values);

  const field = (name: keyof FormValues) => ({
    ...register(name),
    className: errors[name] ? "border-destructive rounded-xl" : "rounded-xl",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/employees"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Employee</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create a new team member account</p>
        </div>
      </div>

      {mutationError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
          {(mutationError as Error).message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Personal Information</h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full Name *</Label>
                <Input placeholder="Rahul Sharma" {...field("full_name")} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input placeholder="rahul@primexservices.in" type="email" {...field("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="+91 98765 43210" {...field("phone")} />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Role & Access</h2>
            <Separator />
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={watch("role")} onValueChange={(v) => setValue("role", v as FormValues["role"])}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin — Full access to everything</SelectItem>
                  <SelectItem value="MANAGER">Manager — Manage orders and customers</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician — View assigned jobs only</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Login Password</h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    {...field("password")}
                    className={`pr-10 ${errors.password ? "border-destructive rounded-xl" : "rounded-xl"}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password *</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  {...field("confirm_password")}
                />
                {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/employees">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="shadow-premium rounded-xl">
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><Save className="w-4 h-4 mr-2" />Add Employee</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
