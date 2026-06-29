"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Sun, Droplets, Layers, Calendar, Clock,
  IndianRupee, User, FileText, Edit, Trash2, ChevronRight,
} from "lucide-react";

import { useOrder, useUpdateOrderStatus, useDeleteOrder } from "@/features/orders/hooks/use-orders";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Order } from "@/features/orders/types";
import { toast } from "sonner";

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Mark as Scheduled",
  IN_PROGRESS: "Start Job",
  COMPLETED: "Mark Completed",
  CANCELLED: "Cancel Order",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrder(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been deleted."
        icon={FileText}
        action={<Button asChild><Link href="/orders">Back to Orders</Link></Button>}
      />
    );
  }

  const nextStatuses = STATUS_FLOW[order.status] ?? [];

  const handleDelete = () => {
    deleteOrder(id, {
      onSuccess: () => {
        toast.success("Order deleted");
        router.push("/orders");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/orders"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-display font-mono">{order.order_number}</h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.service_type} showDot={false} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-xl shadow-premium" disabled={isUpdating}>
                  Update Status <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => updateStatus({ id, status: s })}
                  >
                    {STATUS_LABELS[s] || s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete order {order.order_number}? This action is reversible by an admin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Schedule */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 rounded-2xl">
              <h2 className="text-sm font-bold font-display mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Customer</span>
                  </div>
                  <Link
                    href={`/customers/${order.customer_id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {order.customer_name || "View Customer"}
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Scheduled</span>
                  </div>
                  <span className="font-semibold">
                    {order.scheduled_date
                      ? `${formatDate(order.scheduled_date)}${order.scheduled_time ? ` at ${order.scheduled_time}` : ""}`
                      : "Not scheduled"}
                  </span>
                </div>
                {order.completed_at && (
                  <div className="space-y-3 col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatDateTime(order.completed_at)}
                    </span>
                  </div>
                )}
              </div>
              {order.notes && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </>
              )}
            </Card>
          </motion.div>

          {/* Solar Detail */}
          {order.solar_detail && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold font-display">Solar Cleaning Details</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {[
                    { label: "Panels", value: order.solar_detail.panel_count },
                    { label: "Capacity", value: `${order.solar_detail.capacity_kw} kW` },
                    { label: "Roof Type", value: order.solar_detail.roof_type.replace("_", " ") },
                    { label: "Panel Type", value: order.solar_detail.panel_type },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                {order.solar_detail.remarks && (
                  <p className="text-sm text-muted-foreground mt-3">{order.solar_detail.remarks}</p>
                )}
              </Card>
            </motion.div>
          )}

          {/* Tank Detail */}
          {order.tank_detail && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-bold font-display">Tank Cleaning Details</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {[
                    { label: "Tank Type", value: order.tank_detail.tank_type },
                    { label: "Capacity", value: `${order.tank_detail.capacity_liters} L` },
                    { label: "Tanks", value: order.tank_detail.number_of_tanks },
                    { label: "Chemical", value: order.tank_detail.chemical_used || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                {order.tank_detail.remarks && (
                  <p className="text-sm text-muted-foreground mt-3">{order.tank_detail.remarks}</p>
                )}
              </Card>
            </motion.div>
          )}
        </div>

        {/* Pricing Sidebar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="p-6 rounded-2xl sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold font-display">Pricing</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums text-green-600">−{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({order.tax_rate}%)</span>
                  <span className="tabular-nums">{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="tabular-nums text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Payment tracking coming in Phase 2
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
