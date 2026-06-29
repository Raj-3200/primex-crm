"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, Search, ShoppingBag, Sun, Droplets, Filter,
  ChevronDown, MoreHorizontal, CheckCircle,
} from "lucide-react";

import { useOrders, useUpdateOrderStatus, useDeleteOrder } from "@/features/orders/hooks/use-orders";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/features/orders/types";

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function OrderRow({ order }: { order: Order }) {
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder } = useDeleteOrder();

  const nextStatuses = STATUS_FLOW[order.status] ?? [];

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      <td className="py-3 px-4">
        <Link
          href={`/orders/${order.id}`}
          className="font-mono text-sm font-semibold text-primary hover:underline"
        >
          {order.order_number}
        </Link>
      </td>
      <td className="py-3 px-4">
        <Link href={`/customers/${order.customer_id}`} className="text-sm hover:text-primary transition-colors">
          {order.customer_name || "—"}
        </Link>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {order.service_type === "SOLAR" ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : order.service_type === "TANK" ? (
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          )}
          <span className="text-sm capitalize">{order.service_type.toLowerCase()}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-muted-foreground">
          {order.scheduled_date ? formatDate(order.scheduled_date) : "—"}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(order.total_amount)}
        </span>
      </td>
      <td className="py-3 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`}>View Details</Link>
            </DropdownMenuItem>
            {nextStatuses.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {nextStatuses.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => updateStatus({ id: order.id, status: s })}
                  >
                    Mark {s.replace("_", " ").toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteOrder(order.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    page,
    per_page: 20,
    search: search || undefined,
    status: status || undefined,
    service_type: serviceType || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} total orders` : "Loading…"}
          </p>
        </div>
        <Button asChild className="shadow-premium">
          <Link href="/orders/new">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceType} onValueChange={(v) => { setServiceType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="SOLAR">Solar</SelectItem>
            <SelectItem value="TANK">Tank</SelectItem>
            <SelectItem value="COMBINED">Combined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Order #", "Customer", "Service", "Status", "Scheduled", "Amount", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
            </tbody>
          </table>

          {!isLoading && !data?.items.length && (
            <EmptyState
              title="No orders found"
              description={search ? "No orders match your search." : "Create your first order to get started."}
              icon={ShoppingBag}
              action={
                !search ? (
                  <Button asChild>
                    <Link href="/orders/new">
                      <Plus className="w-4 h-4 mr-2" />
                      New Order
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
