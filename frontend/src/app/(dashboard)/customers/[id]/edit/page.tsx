"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Enter a valid phone number"),
  alternate_phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().min(5, "Enter the full address"),
  maps_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  gst_number: z.string().optional(),
  property_type: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]),
  lead_source: z.enum([
    "REFERRAL", "WEBSITE", "SOCIAL_MEDIA", "WALK_IN", "COLD_CALL", "OTHER",
  ]).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch existing customer data
  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Pre-fill form when customer data loads
  useEffect(() => {
    if (data?.customer) {
      const c = data.customer;
      reset({
        name: c.name || "",
        phone: c.phone || "",
        alternate_phone: c.alternate_phone || "",
        email: c.email || "",
        address: c.address || "",
        maps_url: c.maps_url || "",
        gst_number: c.gst_number || "",
        property_type: c.property_type || "RESIDENTIAL",
        lead_source: c.lead_source || "OTHER",
        notes: c.notes || "",
      });
    }
  }, [data, reset]);

  // Mutation to update customer
  const { mutate: update, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          email: values.email || null,
          maps_url: values.maps_url || null,
          gst_number: values.gst_number || null,
          alternate_phone: values.alternate_phone || null,
          notes: values.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push(`/customers/${id}`);
    },
  });

  const onSubmit = (values: FormValues) => update(values);

  const field = (name: keyof FormValues) => ({
    ...register(name),
    className: errors[name]
      ? "border-destructive focus-visible:ring-destructive rounded-xl"
      : "rounded-xl",
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href={`/customers/${id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Edit Customer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.customer?.name || "Update customer details"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Contact Information */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Contact Information</h2>
            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="John Smith" {...field("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input placeholder="john@example.com" type="email" {...field("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input placeholder="+91 98765 43210" {...field("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Alternate Phone</Label>
                <Input placeholder="+91 98765 43211" {...field("alternate_phone")} />
              </div>

              <div className="space-y-1.5">
                <Label>GST Number</Label>
                <Input placeholder="22AAAAA0000A1Z5" {...field("gst_number")} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Property Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Property Information</h2>
            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Property Type *</Label>
                <Select
                  value={watch("property_type")}
                  onValueChange={(v) => setValue("property_type", v as FormValues["property_type"])}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                  </SelectContent>
                </Select>
                {errors.property_type && (
                  <p className="text-xs text-destructive">{errors.property_type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Lead Source</Label>
                <Select
                  value={watch("lead_source")}
                  onValueChange={(v) => setValue("lead_source", v as FormValues["lead_source"])}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                    <SelectItem value="WALK_IN">Walk In</SelectItem>
                    <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Full Address *</Label>
              <Textarea
                placeholder="123, Street Name, Area, City - 400001"
                rows={3}
                className="rounded-xl resize-none"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Google Maps URL</Label>
              <Input placeholder="https://maps.google.com/..." {...field("maps_url")} />
            </div>
          </Card>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Additional Notes</h2>
            <Separator />
            <Textarea
              placeholder="Any additional notes about this customer…"
              rows={4}
              className="rounded-xl resize-none"
              {...register("notes")}
            />
          </Card>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={`/customers/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="shadow-premium rounded-xl">
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
