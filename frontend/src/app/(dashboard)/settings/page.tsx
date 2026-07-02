"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Building2,
  Shield,
  Palette,
  Bell,
  Sun,
  Moon,
  Monitor,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type CompanyForm = z.infer<typeof companySchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="font-semibold font-display text-sm">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Company Section ──────────────────────────────────────────────────────────

function CompanySection() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "PrimeX Services",
      email: "contact@primexservices.in",
      phone: "+91 98765 43210",
      address: "123, Service Hub, Mumbai, Maharashtra 400001",
    },
  });

  const onSubmit = async (_data: CompanyForm) => {
    // Company info is org-level config — saved to localStorage for display only
    // In a multi-company setup this would go to a settings API
    localStorage.setItem("primex_company_info", JSON.stringify(_data));
    toast.success("Company info updated successfully");
  };

  return (
    <Section
      icon={Building2}
      title="Company Information"
      description="Manage your business details and contact info"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" error={errors.name?.message}>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register("name")}
                className="pl-9 rounded-xl"
                placeholder="PrimeX Services"
              />
            </div>
          </Field>
          <Field label="Email Address" error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register("email")}
                type="email"
                className="pl-9 rounded-xl"
                placeholder="contact@primex.in"
              />
            </div>
          </Field>
          <Field label="Phone Number" error={errors.phone?.message}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register("phone")}
                className="pl-9 rounded-xl"
                placeholder="+91 98765 43210"
              />
            </div>
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register("address")}
                className="pl-9 rounded-xl"
                placeholder="123, Street, City"
              />
            </div>
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-sm">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: data.current_password, new_password: data.new_password }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.detail || "Failed to change password");
      return;
    }
    toast.success("Password changed successfully");
    reset();
  };

  return (
    <Section
      icon={Shield}
      title="Security"
      description="Change your password and manage account security"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <Field label="Current Password" error={errors.current_password?.message}>
          <div className="relative">
            <Input
              {...register("current_password")}
              type={showCurrent ? "text" : "password"}
              className="pr-10 rounded-xl"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCurrent ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </Field>
        <Field label="New Password" error={errors.new_password?.message}>
          <div className="relative">
            <Input
              {...register("new_password")}
              type={showNew ? "text" : "password"}
              className="pr-10 rounded-xl"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNew ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </Field>
        <Field label="Confirm New Password" error={errors.confirm_password?.message}>
          <Input
            {...register("confirm_password")}
            type="password"
            className="rounded-xl"
            placeholder="Repeat new password"
          />
        </Field>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-sm">
            <Shield className="w-4 h-4 mr-2" />
            {isSubmitting ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─── Appearance Section ───────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <Section
      icon={Palette}
      title="Appearance"
      description="Choose your preferred color theme"
    >
      <div className="flex flex-wrap gap-3">
        {themes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setTheme(key);
              toast.success(`Theme set to ${label}`);
            }}
            className={cn(
              "flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 transition-all",
              theme === key
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                theme === key ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            {theme === key && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </Section>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

const NOTIFICATION_ITEMS = [
  {
    id: "new_orders",
    label: "New Orders",
    description: "Get notified when a new order is created",
    defaultChecked: true,
  },
  {
    id: "job_updates",
    label: "Job Status Updates",
    description: "Alerts when job status changes",
    defaultChecked: true,
  },
  {
    id: "daily_summary",
    label: "Daily Summary",
    description: "Receive a daily digest of activities",
    defaultChecked: false,
  },
  {
    id: "payment_alerts",
    label: "Payment Alerts",
    description: "Notifications for payments and invoices",
    defaultChecked: true,
  },
  {
    id: "reminders",
    label: "Upcoming Job Reminders",
    description: "Reminders before scheduled jobs",
    defaultChecked: true,
  },
];

function NotificationsSection() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(
      NOTIFICATION_ITEMS.map((item) => [item.id, item.defaultChecked])
    )
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem("primex_notification_prefs", JSON.stringify(settings));
    toast.success("Notification preferences saved");
    setSaving(false);
  };

  return (
    <Section
      icon={Bell}
      title="Notifications"
      description="Control what alerts and notifications you receive"
    >
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0"
          >
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
            <Switch
              checked={settings[item.id]}
              onCheckedChange={(val) =>
                setSettings((prev) => ({ ...prev, [item.id]: val }))
              }
            />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Save Preferences"}
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account and application preferences
            {user && (
              <span className="ml-1 text-primary font-medium">
                · {user.full_name}
              </span>
            )}
          </p>
        </div>
      </div>

      <CompanySection />
      <SecuritySection />
      <AppearanceSection />
      <NotificationsSection />
    </div>
  );
}
