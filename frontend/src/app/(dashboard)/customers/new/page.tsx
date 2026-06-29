"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { useCreateCustomer } from "@/features/customers/hooks/use-customers";
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

export default function NewCustomerPage() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateCustomer();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lead_source: "OTHER" },
  });

  const onSubmit = (values: FormValues) => {
    create(
      {
        ...values,
        email: values.email || undefined,
        maps_url: values.maps_url || undefined,
        gst_number: values.gst_number || undefined,
        alternate_phone: values.alternate_phone || undefined,
      },
      {
        onSuccess: (customer) => router.push(`/customers/${customer.id}`),
      }
    );
  };

  const field = (name: keyof FormValues) => ({
    ...register(name),
    className: errors[name]
      ? "border-destructive focus-visible:ring-destructive rounded-xl"
      : "rounded-xl",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/customers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">New Customer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the customer details below
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold font-display">Contact Information</h2>
            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="John Smith" {...field("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input placeholder="john@example.com" type="email" {...field("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input placeholder="+91 98765 43210" {...field("phone")} />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
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
                  onValueChange={(v) =>
                    setValue("property_type", v as FormValues["property_type"])
                  }
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
                  <p className="text-xs text-destructive">
                    {errors.property_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Lead Source</Label>
                <Select
                  defaultValue="OTHER"
                  onValueChange={(v) =>
                    setValue("lead_source", v as FormValues["lead_source"])
                  }
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
              <Input
                placeholder="https://maps.google.com/..."
                {...field("maps_url")}
              />
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
            <Link href="/customers">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="shadow-premium rounded-xl"
          >
            {isPending ? (
              "Saving…"
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Customer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
