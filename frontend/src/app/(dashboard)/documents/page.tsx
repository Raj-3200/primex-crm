"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FolderOpen, Image, FileText, Eye, Sun, Droplets, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

// Documents = orders with solar/tank detail photos (real images stored in DB)
export default function DocumentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      // Fetch orders that have service details (photos)
      const res = await fetch("/api/orders?per_page=50", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const ordersData = await res.json();

      // Also get solar and tank detail counts
      const statsRes = await fetch("/api/reports", { headers: { Authorization: `Bearer ${token}` } });
      const stats = statsRes.ok ? await statsRes.json() : null;

      return { orders: ordersData.items, total: ordersData.total, stats };
    },
    staleTime: 30_000,
  });

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Documents & Files</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Job photos, reports, and order attachments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm text-muted-foreground">Solar Jobs</p>
          </div>
          <p className="text-2xl font-bold font-display">
            {orders.filter((o: any) => o.service_type === "SOLAR").length}
          </p>
        </Card>
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-muted-foreground">Tank Jobs</p>
          </div>
          <p className="text-2xl font-bold font-display">
            {orders.filter((o: any) => o.service_type === "TANK").length}
          </p>
        </Card>
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">Combined</p>
          </div>
          <p className="text-2xl font-bold font-display">
            {orders.filter((o: any) => o.service_type === "COMBINED").length}
          </p>
        </Card>
      </div>

      {/* Order Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card className="py-16 text-center rounded-2xl">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No documents yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create orders to generate job documents and reports</p>
          <Button asChild size="sm"><Link href="/orders/new">Create First Order</Link></Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: any, i: number) => {
            const Icon = order.service_type === "SOLAR" ? Sun : order.service_type === "TANK" ? Droplets : Activity;
            const iconBg = order.service_type === "SOLAR" ? "bg-amber-100" : order.service_type === "TANK" ? "bg-blue-100" : "bg-green-100";
            const iconColor = order.service_type === "SOLAR" ? "text-amber-600" : order.service_type === "TANK" ? "text-blue-600" : "text-green-600";
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-5 rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-sm text-primary truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="font-medium text-foreground">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8 rounded-lg" asChild>
                      <Link href={`/orders/${order.id}`}><Eye className="w-3 h-3 mr-1" />View Report</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 rounded-lg px-2" title="Download">
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
