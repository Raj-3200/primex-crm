"use client";
import { API_BASE } from "@/lib/backend";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, IndianRupee, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const PIE_COLORS = ["#E8722A", "#3B82F6", "#22C55E"];

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function ReportsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return <ReportsSkeleton />;
  if (isError || !data) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Reports & Analytics</h1>
      <Card className="p-12 rounded-2xl text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Failed to load reports.</p>
      </Card>
    </div>
  );

  const { monthly_revenue = [], top_customers = [], service_breakdown = [], status_breakdown = [] } = data;

  // Compute summary from data
  const totalRevenue = monthly_revenue.reduce((s: number, r: any) => s + r.revenue, 0);
  const totalOrders = status_breakdown.reduce((s: number, r: any) => s + r.count, 0);
  const totalCustomers = top_customers.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Service distribution for pie
  const pieData = service_breakdown.map((s: any) => ({
    name: s.service_type === "SOLAR" ? "Solar" : s.service_type === "TANK" ? "Tank" : "Combined",
    value: s.count,
  }));

  // Status map
  const statusMap: Record<string, number> = {};
  status_breakdown.forEach((s: any) => { statusMap[s.status] = s.count; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Business intelligence overview</p>
      </div>

      {/* Summary Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}>
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: IndianRupee, color: "text-primary" },
          { label: "Total Orders", value: String(totalOrders), icon: ShoppingBag, color: "text-blue-500" },
          { label: "Top Customers", value: String(totalCustomers), icon: Users, color: "text-green-500" },
          { label: "Avg Order Value", value: formatCurrency(avgOrderValue), icon: TrendingUp, color: "text-purple-500" },
        ].map((card) => (
          <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{card.value}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6 rounded-2xl">
          <h2 className="text-base font-bold font-display mb-1">Revenue Trend</h2>
          <p className="text-xs text-muted-foreground mb-6">Last 6 months</p>
          {monthly_revenue.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly_revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8722A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E8722A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#E8722A" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 rounded-2xl">
          <h2 className="text-base font-bold font-display mb-1">Service Mix</h2>
          <p className="text-xs text-muted-foreground mb-4">All time</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                <Tooltip formatter={(v: any) => `${v} orders`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 rounded-2xl">
          <h2 className="text-base font-bold font-display mb-4">Top Customers</h2>
          {top_customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No customer data yet</p>
          ) : (
            <div className="space-y-3">
              {top_customers.slice(0, 8).map((c: any, i: number) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.order_count} orders</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(c.total_revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl">
          <h2 className="text-base font-bold font-display mb-4">Order Status Breakdown</h2>
          {status_breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Completed", key: "COMPLETED", color: "bg-green-500" },
                { label: "In Progress", key: "IN_PROGRESS", color: "bg-blue-500" },
                { label: "Scheduled", key: "SCHEDULED", color: "bg-amber-500" },
                { label: "Pending", key: "PENDING", color: "bg-orange-400" },
                { label: "Cancelled", key: "CANCELLED", color: "bg-destructive" },
              ].map((s) => {
                const val = statusMap[s.key] || 0;
                const pct = totalOrders > 0 ? Math.round((val / totalOrders) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold">{val} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${s.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
