"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  Droplets,
  Layers,
  Check,
  Save,
} from "lucide-react";
import Link from "next/link";

import { useCreateOrder } from "@/features/orders/hooks/use-orders";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

// ── Step 1 schema ───────────────────────────────────────────────────────────
const step1Schema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  service_type: z.enum(["SOLAR", "TANK", "COMBINED"]),
});

// ── Solar detail schema ─────────────────────────────────────────────────────
const solarSchema = z.object({
  panel_count: z.coerce.number().int().min(1),
  capacity_kw: z.coerce.number().min(0.1),
  roof_type: z.enum(["FLAT", "SLOPED", "GROUND_MOUNTED"]),
  panel_type: z.enum(["MONOCRYSTALLINE", "POLYCRYSTALLINE", "THIN_FILM"]),
  remarks: z.string().optional(),
});

// ── Tank detail schema ──────────────────────────────────────────────────────
const tankSchema = z.object({
  tank_type: z.enum(["OVERHEAD", "UNDERGROUND", "SUMP"]),
  capacity_liters: z.coerce.number().int().min(1),
  number_of_tanks: z.coerce.number().int().min(1),
  chemical_used: z.string().optional(),
  remarks: z.string().optional(),
});

// ── Pricing schema ──────────────────────────────────────────────────────────
const pricingSchema = z.object({
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

const STEPS = ["Service", "Details", "Pricing", "Review"];

interface StepIndicatorProps {
  current: number;
}

function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              i === current
                ? "bg-primary text-primary-foreground"
                : i < current
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < current ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px w-8 transition-all",
                i < current ? "bg-primary" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") || "";

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    customer_id: preselectedCustomer,
    discount: 0,
    tax_rate: 0,
  });

  const { mutate: createOrder, isPending } = useCreateOrder();
  const { data: customers } = useCustomers({ per_page: 100 });

  // Step forms
  const step1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { customer_id: preselectedCustomer },
  });
  const solarForm = useForm({ resolver: zodResolver(solarSchema) });
  const tankForm = useForm({ resolver: zodResolver(tankSchema) });
  const pricingForm = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: { discount: 0, tax_rate: 0, subtotal: 0 },
  });

  const serviceType = (formData.service_type as string) || "SOLAR";

  const needsSolar = ["SOLAR", "COMBINED"].includes(serviceType);
  const needsTank = ["TANK", "COMBINED"].includes(serviceType);

  const handleStep1 = step1.handleSubmit((values) => {
    setFormData((d) => ({ ...d, ...values }));
    setStep(1);
  });

  const handleStep2 = async () => {
    let valid = true;
    if (needsSolar) valid = await solarForm.trigger();
    if (needsTank) valid = valid && (await tankForm.trigger());
    if (valid) {
      const solarValues = needsSolar ? solarForm.getValues() : undefined;
      const tankValues = needsTank ? tankForm.getValues() : undefined;
      setFormData((d) => ({
        ...d,
        solar_detail: solarValues,
        tank_detail: tankValues,
      }));
      setStep(2);
    }
  };

  const handleStep3 = pricingForm.handleSubmit((values) => {
    setFormData((d) => ({ ...d, ...values }));
    setStep(3);
  });

  const handleSubmit = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const discount = Number(formData.discount) || 0;
    const taxRate = Number(formData.tax_rate) || 0;

    createOrder(
      {
        customer_id: formData.customer_id as string,
        service_type: formData.service_type as "SOLAR" | "TANK" | "COMBINED",
        scheduled_date: formData.scheduled_date as string | undefined,
        scheduled_time: formData.scheduled_time as string | undefined,
        subtotal,
        discount,
        tax_rate: taxRate,
        notes: formData.notes as string | undefined,
        solar_detail: formData.solar_detail as any,
        tank_detail: formData.tank_detail as any,
      },
      { onSuccess: (order) => router.push(`/orders/${order.id}`) },
    );
  };

  const subtotal = Number(pricingForm.watch("subtotal")) || 0;
  const discount = Number(pricingForm.watch("discount")) || 0;
  const taxRate = Number(pricingForm.watch("tax_rate")) || 0;
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;

  const selectedCustomer = customers?.items.find(
    (c) => c.id === formData.customer_id,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/orders">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">New Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a service order
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        {/* ── Step 0: Service Selection ─────────────────────────────── */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 rounded-2xl space-y-5">
              <h2 className="text-base font-bold font-display">
                Select Customer & Service
              </h2>
              <Separator />
              <form onSubmit={handleStep1} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>Customer *</Label>
                  <Select
                    value={step1.watch("customer_id")}
                    onValueChange={(v) => step1.setValue("customer_id", v)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Search and select customer…" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.items.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} — {c.customer_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step1.formState.errors.customer_id && (
                    <p className="text-xs text-destructive">
                      {step1.formState.errors.customer_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Service Type *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: "SOLAR",
                        label: "Solar",
                        icon: Sun,
                        color: "amber",
                      },
                      {
                        value: "TANK",
                        label: "Tank",
                        icon: Droplets,
                        color: "blue",
                      },
                      {
                        value: "COMBINED",
                        label: "Combined",
                        icon: Layers,
                        color: "green",
                      },
                    ].map(({ value, label, icon: Icon, color }) => {
                      const isSelected = step1.watch("service_type") === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            step1.setValue("service_type", value as any)
                          }
                          className={cn(
                            "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-6 h-6",
                              color === "amber"
                                ? "text-amber-500"
                                : color === "blue"
                                  ? "text-blue-500"
                                  : "text-green-500",
                            )}
                          />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {step1.formState.errors.service_type && (
                    <p className="text-xs text-destructive">
                      Select a service type
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="rounded-xl shadow-premium">
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ── Step 1: Service Details ───────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 rounded-2xl space-y-5">
              <h2 className="text-base font-bold font-display">
                Service Details
              </h2>
              <Separator />

              {needsSolar && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                    <Sun className="w-4 h-4" /> Solar Cleaning Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Panel Count *</Label>
                      <Input
                        type="number"
                        min={1}
                        className="rounded-xl"
                        {...solarForm.register("panel_count")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Capacity (kW) *</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        className="rounded-xl"
                        {...solarForm.register("capacity_kw")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Roof Type *</Label>
                      <Select
                        onValueChange={(v) =>
                          solarForm.setValue("roof_type", v as any)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FLAT">Flat</SelectItem>
                          <SelectItem value="SLOPED">Sloped</SelectItem>
                          <SelectItem value="GROUND_MOUNTED">
                            Ground Mounted
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Panel Type *</Label>
                      <Select
                        onValueChange={(v) =>
                          solarForm.setValue("panel_type", v as any)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONOCRYSTALLINE">
                            Monocrystalline
                          </SelectItem>
                          <SelectItem value="POLYCRYSTALLINE">
                            Polycrystalline
                          </SelectItem>
                          <SelectItem value="THIN_FILM">Thin Film</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Textarea
                      className="rounded-xl resize-none"
                      rows={2}
                      {...solarForm.register("remarks")}
                    />
                  </div>
                </div>
              )}

              {needsTank && (
                <div className="space-y-4">
                  {needsSolar && <Separator />}
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <Droplets className="w-4 h-4" /> Tank Cleaning Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Tank Type *</Label>
                      <Select
                        onValueChange={(v) =>
                          tankForm.setValue("tank_type", v as any)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OVERHEAD">Overhead</SelectItem>
                          <SelectItem value="UNDERGROUND">
                            Underground
                          </SelectItem>
                          <SelectItem value="SUMP">Sump</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Capacity (Liters) *</Label>
                      <Input
                        type="number"
                        min={1}
                        className="rounded-xl"
                        {...tankForm.register("capacity_liters")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Number of Tanks *</Label>
                      <Input
                        type="number"
                        min={1}
                        defaultValue={1}
                        className="rounded-xl"
                        {...tankForm.register("number_of_tanks")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Chemical Used</Label>
                      <Input
                        placeholder="e.g. Chlorine"
                        className="rounded-xl"
                        {...tankForm.register("chemical_used")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Textarea
                      className="rounded-xl resize-none"
                      rows={2}
                      {...tankForm.register("remarks")}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleStep2}
                  className="rounded-xl shadow-premium"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Pricing ───────────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 rounded-2xl space-y-5">
              <h2 className="text-base font-bold font-display">
                Scheduling & Pricing
              </h2>
              <Separator />
              <form onSubmit={handleStep3} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Scheduled Date</Label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      {...pricingForm.register("scheduled_date")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Scheduled Time</Label>
                    <Input
                      type="time"
                      className="rounded-xl"
                      {...pricingForm.register("scheduled_time")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Subtotal (₹) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="rounded-xl"
                      {...pricingForm.register("subtotal")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={0}
                      className="rounded-xl"
                      {...pricingForm.register("discount")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      defaultValue={0}
                      className="rounded-xl"
                      {...pricingForm.register("tax_rate")}
                    />
                  </div>
                </div>

                {/* Live pricing summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums text-green-600">
                      −{formatCurrency(discount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({taxRate}%)</span>
                    <span className="tabular-nums">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total</span>
                    <span className="tabular-nums text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl resize-none"
                    rows={2}
                    placeholder="Any special instructions…"
                    {...pricingForm.register("notes")}
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="submit" className="rounded-xl shadow-premium">
                    Review <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Review ────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 rounded-2xl space-y-5">
              <h2 className="text-base font-bold font-display">
                Review & Confirm
              </h2>
              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">
                    {selectedCustomer?.name || (formData.customer_id as string)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Type</span>
                  <span className="font-medium">{serviceType}</span>
                </div>
                {(formData.scheduled_date as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span className="font-medium">
                      {formData.scheduled_date as string}
                      {(formData.scheduled_time as string | undefined)
                        ? ` at ${formData.scheduled_time as string}`
                        : ""}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span className="text-primary tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-xl shadow-premium"
                >
                  {isPending ? (
                    "Creating…"
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
