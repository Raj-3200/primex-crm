"use client";

import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  Users,
  CalendarClock,
  Sun,
  Droplets,
  ArrowRight,
  Clock,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

// ── Skeleton loader for the dashboard ─────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Custom chart tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-premium text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

const PIE_COLORS = ["#E8722A", "#3B82F6", "#22C55E"];

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description="Could not connect to the server. Please check your connection."
        icon={Activity}
        action={
          <Button onClick={() => window.location.reload()}>Retry</Button>
        }
      />
    );
  }

  const { stats, revenue_chart, service_distribution, upcoming_jobs, recent_activity } =
    data!;

  const pieData = [
    { name: "Solar", value: service_distribution.solar },
    { name: "Tank", value: service_distribution.tank },
    { name: "Combined", value: service_distribution.combined },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page heading ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button asChild size="sm" className="shadow-premium">
          <Link href="/orders/new">
            + New Order
          </Link>
        </Button>
      </div>

      {/* ── Stats Grid (8 cards) ────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
          hidden: {},
        }}
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Today's Revenue",
            value: stats.today_revenue,
            icon: IndianRupee,
            variant: "orange" as const,
            format: "currency" as const,
          },
          {
            title: "Monthly Revenue",
            value: stats.monthly_revenue,
            icon: TrendingUp,
            variant: "amber" as const,
            format: "currency" as const,
          },
          {
            title: "Yearly Revenue",
            value: stats.yearly_revenue,
            icon: IndianRupee,
            variant: "green" as const,
            format: "currency" as const,
          },
          {
            title: "Outstanding",
            value: stats.total_outstanding,
            icon: IndianRupee,
            variant: "blue" as const,
            format: "currency" as const,
          },
          {
            title: "Today's Jobs",
            value: stats.today_jobs,
            icon: CalendarClock,
            variant: "orange" as const,
            format: "number" as const,
          },
          {
            title: "Upcoming Jobs",
            value: stats.upcoming_jobs,
            icon: ShoppingBag,
            variant: "amber" as const,
            format: "number" as const,
          },
          {
            title: "Total Customers",
            value: stats.total_customers,
            icon: Users,
            variant: "green" as const,
            format: "number" as const,
          },
          {
            title: "New This Month",
            value: stats.new_customers_this_month,
            icon: Users,
            variant: "blue" as const,
            format: "number" as const,
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6 rounded-2xl border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-foreground font-display">
                Revenue Overview
              </h2>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
          </div>
          {revenue_chart.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue_chart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8722A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E8722A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <ReTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E8722A"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#profitGrad)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Service Distribution */}
        <Card className="p-6 rounded-2xl border-border shadow-sm">
          <h2 className="text-base font-bold text-foreground font-display mb-1">
            Service Mix
          </h2>
          <p className="text-xs text-muted-foreground mb-6">All time</p>
          {service_distribution.solar + service_distribution.tank + service_distribution.combined === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span className="text-xs text-muted-foreground">{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {[
                  { label: "Solar", value: service_distribution.solar, color: "bg-primary" },
                  { label: "Tank", value: service_distribution.tank, color: "bg-blue-500" },
                  { label: "Combined", value: service_distribution.combined, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-muted-foreground flex-1">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Jobs */}
        <Card className="p-6 rounded-2xl border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground font-display">
              Upcoming Jobs
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
              <Link href="/orders?status=SCHEDULED">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          {upcoming_jobs.length === 0 ? (
            <EmptyState
              title="No upcoming jobs"
              description="Schedule some orders to see them here"
              icon={CalendarClock}
            />
          ) : (
            <div className="space-y-3">
              {upcoming_jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/orders/${job.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      job.service_type === "SOLAR"
                        ? "bg-amber-500/15"
                        : job.service_type === "TANK"
                        ? "bg-blue-500/15"
                        : "bg-green-500/15"
                    }`}
                  >
                    {job.service_type === "SOLAR" ? (
                      <Sun className="w-4 h-4 text-amber-600" />
                    ) : job.service_type === "TANK" ? (
                      <Droplets className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {job.customer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.order_number} · {formatDate(job.scheduled_date)}
                      {job.scheduled_time && ` · ${job.scheduled_time}`}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 rounded-2xl border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground font-display">
              Recent Activity
            </h2>
          </div>
          {recent_activity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Actions performed in the CRM will appear here"
              icon={Clock}
            />
          ) : (
            <div className="space-y-1">
              {recent_activity.slice(0, 8).map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3 py-2.5 px-2 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
