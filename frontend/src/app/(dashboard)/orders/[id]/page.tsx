"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Sun, Droplets, Activity, User, Phone,
  MapPin, Calendar, IndianRupee, Clock, CheckCircle, UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const SERVICE_ICONS: Record<string, any> = { SOLAR: Sun, TANK: Droplets, COMBINED: Activity };
const SERVICE_COLORS: Record<string, string> = {
  SOLAR: "bg-amber-500/15 text-amber-600",
  TANK: "bg-blue-500/15 text-blue-600",
  COMBINED: "bg-green-500/15 text-green-600",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="space-y-4">
      <Button variant="ghost" asChild><Link href="/orders"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
      <Card className="p-12 text-center rounded-2xl">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Order not found</p>
      </Card>
    </div>
  );

  const { order, solar_detail, tank_detail, activity_logs = [] } = data;
  const Icon = SERVICE_ICONS[order.service_type] || Activity;
  const iconClass = SERVICE_COLORS[order.service_type] || "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">{order.service_type.replace("_", " ")} Service</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <Card className="p-5 rounded-2xl">
            <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Customer</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Link href={`/customers/${order.customer_id}`} className="font-semibold hover:text-primary transition-colors">
                  {order.customer_name}
                </Link>
              </div>
              {order.customer_phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{order.customer_phone}</div>}
              {order.customer_address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ""}</div>}
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-5 rounded-2xl">
            <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Schedule</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">{order.scheduled_date ? formatDate(order.scheduled_date) : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{order.scheduled_time ? String(order.scheduled_time).slice(0, 5) : "Not set"}</p>
                </div>
              </div>
              {order.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium">{formatDate(order.completed_at)}</p>
                  </div>
                </div>
              )}
              {order.assigned_name && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{order.assigned_name}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Service Details */}
          {solar_detail && (
            <Card className="p-5 rounded-2xl">
              <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Solar Details</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Panel Count</p><p className="font-semibold">{solar_detail.panel_count}</p></div>
                <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-semibold">{solar_detail.capacity_kw} kW</p></div>
                <div><p className="text-xs text-muted-foreground">Roof Type</p><p className="font-semibold">{solar_detail.roof_type}</p></div>
                <div><p className="text-xs text-muted-foreground">Panel Type</p><p className="font-semibold">{solar_detail.panel_type}</p></div>
                {solar_detail.remarks && <div className="col-span-2"><p className="text-xs text-muted-foreground">Remarks</p><p className="font-medium">{solar_detail.remarks}</p></div>}
              </div>
            </Card>
          )}
          {tank_detail && (
            <Card className="p-5 rounded-2xl">
              <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Tank Details</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Tank Type</p><p className="font-semibold">{tank_detail.tank_type}</p></div>
                <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-semibold">{tank_detail.capacity_liters}L</p></div>
                <div><p className="text-xs text-muted-foreground">No. of Tanks</p><p className="font-semibold">{tank_detail.number_of_tanks}</p></div>
                {tank_detail.chemical_used && <div><p className="text-xs text-muted-foreground">Chemical</p><p className="font-semibold">{tank_detail.chemical_used}</p></div>}
                {tank_detail.remarks && <div className="col-span-2"><p className="text-xs text-muted-foreground">Remarks</p><p className="font-medium">{tank_detail.remarks}</p></div>}
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Pricing */}
          <Card className="p-5 rounded-2xl">
            <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Pricing</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              {order.tax_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({order.tax_rate}%)</span><span>{formatCurrency(order.tax_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span><span className="text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="p-5 rounded-2xl">
              <h2 className="text-sm font-bold font-display mb-2 text-muted-foreground uppercase tracking-wide">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="p-5 rounded-2xl">
            <h2 className="text-sm font-bold font-display mb-3 text-muted-foreground uppercase tracking-wide">Activity</h2>
            {activity_logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity recorded</p>
            ) : (
              <div className="space-y-2">
                {activity_logs.map((log: any, i: number) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium">{log.action || log.message || "Action performed"}</p>
                      <p className="text-muted-foreground">{log.full_name} · {formatDate(log.created_at)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
