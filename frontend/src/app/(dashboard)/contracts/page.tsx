"use client";
import { API_BASE } from "@/lib/backend";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FilePenLine, Search, Plus, Eye, IndianRupee,
  AlertTriangle, CheckCircle2, Clock, RefreshCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", { search, page }],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const qs = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search) qs.set("search", search);
      const res = await fetch(`/api/contracts?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, expired: 0, value: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Contracts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Annual Maintenance Contract management</p>
        </div>
        <Button asChild>
          <Link href="/orders/new"><Plus className="w-4 h-4 mr-2" />New Contract</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contracts", value: stats.total, icon: FilePenLine, color: "text-primary" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-green-500" },
          { label: "Expired", value: stats.expired, icon: AlertTriangle, color: "text-red-500" },
          { label: "Total Value", value: formatCurrency(stats.value), icon: IndianRupee, color: "text-blue-500" },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by contract # or customer…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 rounded-xl" />
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <FilePenLine className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No contracts found</p>
            <p className="text-sm text-muted-foreground mb-4">Create an AMC order to generate a contract</p>
            <Button asChild size="sm"><Link href="/orders/new">Create Contract</Link></Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-semibold text-primary">{item.order_number}</TableCell>
                  <TableCell>
                    <p className="font-medium">{item.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{item.customer_phone}</p>
                  </TableCell>
                  <TableCell>
                    {item.is_expired ? (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    ) : item.is_expiring_soon ? (
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Expiring Soon</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      {item.is_expiring_soon && !item.is_expired && <RefreshCcw className="w-3.5 h-3.5 text-amber-500" />}
                      {formatDate(item.renewal_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${item.id}`}><Eye className="w-4 h-4 mr-1" />View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
