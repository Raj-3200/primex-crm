"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, IndianRupee, Percent, ShoppingBag,
  ArrowUp, ArrowDown, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function ExpensesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/expenses", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );

  if (isError || !data) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Expenses & Financials</h1>
      <Card className="p-12 text-center rounded-2xl">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Failed to load expense data</p>
      </Card>
    </div>
  );

  const { summary, monthly, by_service } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Expenses & Financials</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue, cost, and profit analysis</p>
      </div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } }, hidden: {} }}>
        {[
          { label: "Gross Revenue", value: formatCurrency(summary.total_revenue), icon: IndianRupee, color: "text-primary", trend: "up" },
          { label: "Est. Costs (35%)", value: formatCurrency(summary.estimated_cost), icon: TrendingUp, color: "text-red-500", trend: "down" },
          { label: "Gross Profit", value: formatCurrency(summary.gross_profit), icon: ArrowUp, color: "text-green-500", trend: "up" },
          { label: "Margin", value: `${summary.margin_pct}%`, icon: Percent, color: "text-blue-500", trend: summary.margin_pct > 50 ? "up" : "down" },
        ].map((card) => (
          <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold font-display">{card.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${card.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {card.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span>vs last period</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Monthly Chart */}
      <Card className="p-6 rounded-2xl">
        <h2 className="text-base font-bold font-display mb-1">Monthly P&L</h2>
        <p className="text-xs text-muted-foreground mb-6">Revenue vs estimated costs vs profit — last 6 months</p>
        {monthly.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">No completed orders yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="revenue" name="Revenue" fill="#E8722A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimated_cost" name="Est. Cost" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Service Breakdown */}
      <Card className="p-6 rounded-2xl">
        <h2 className="text-base font-bold font-display mb-4">Revenue by Service Type</h2>
        {by_service.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No service data yet</p>
        ) : (
          <div className="space-y-4">
            {by_service.map((s: any) => {
              const totalRev = by_service.reduce((acc: number, b: any) => acc + b.revenue, 0) || 1;
              const pct = Math.round((s.revenue / totalRev) * 100);
              return (
                <div key={s.service_type}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.service_type === "SOLAR" ? "Solar Cleaning" : s.service_type === "TANK" ? "Tank Cleaning" : "Combined (AMC)"}</span>
                      <span className="text-muted-foreground text-xs">{s.jobs} jobs</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(s.revenue)} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${s.service_type === "SOLAR" ? "bg-amber-500" : s.service_type === "TANK" ? "bg-blue-500" : "bg-green-500"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
