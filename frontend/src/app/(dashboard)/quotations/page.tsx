"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText, Search, Plus, Eye, IndianRupee,
  Clock, CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Draft", color: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["quotations", { search, status, page }],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const qs = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) qs.set("search", search);
      if (status) qs.set("status", status);
      const res = await fetch(`/api/quotations?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, pending: 0, sent: 0, total_value: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Estimates and quotes for customers</p>
        </div>
        <Button asChild>
          <Link href="/orders/new"><Plus className="w-4 h-4 mr-2" />New Quotation</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Quotes", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "Draft", value: stats.pending, icon: Clock, color: "text-amber-500" },
          { label: "Sent", value: stats.sent, icon: CheckCircle2, color: "text-blue-500" },
          { label: "Total Value", value: formatCurrency(stats.total_value), icon: IndianRupee, color: "text-green-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold font-display">{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by order # or customer…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 rounded-xl" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Sent</SelectItem>
            <SelectItem value="CANCELLED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">No quotations found</p>
            <p className="text-sm text-muted-foreground mb-4">Pending and scheduled orders appear as quotations</p>
            <Button asChild size="sm"><Link href="/orders/new">Create First Order</Link></Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => {
                const st = STATUS_LABELS[item.status] ?? { label: item.status, color: "bg-muted text-muted-foreground" };
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-semibold text-primary">{item.order_number}</TableCell>
                    <TableCell>
                      <p className="font-medium">{item.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{item.customer_phone}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.service_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${item.id}`}><Eye className="w-4 h-4 mr-1" />View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {data && data.pages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {data.pages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
