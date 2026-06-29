"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar,
  ShoppingBag, IndianRupee, Edit, Sun, Droplets, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/customers/${id}`, {
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
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="space-y-4">
      <Button variant="ghost" asChild><Link href="/customers"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
      <Card className="p-12 text-center rounded-2xl">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Customer not found</p>
      </Card>
    </div>
  );

  const { customer, orders = [], stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground font-display">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.customer_type} Customer</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/customers/${id}/edit`}><Edit className="w-4 h-4 mr-2" />Edit</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer Info */}
        <Card className="p-6 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{customer.phone}</span>
            </div>
            {customer.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{customer.address}{customer.city ? `, ${customer.city}` : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Since {formatDate(customer.created_at)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <Badge variant={customer.is_active !== false ? "default" : "secondary"}>
              {customer.is_active !== false ? "Active" : "Inactive"}
            </Badge>
          </div>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Orders", value: stats?.total_orders ?? 0, icon: ShoppingBag },
              { label: "Total Revenue", value: formatCurrency(stats?.total_revenue ?? 0), icon: IndianRupee },
              { label: "Completed", value: stats?.completed ?? 0, icon: Activity },
            ].map((s) => (
              <Card key={s.label} className="p-4 rounded-2xl">
                <s.icon className="w-4 h-4 text-primary mb-2" />
                <p className="text-xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Orders List */}
          <Card className="p-4 rounded-2xl">
            <h2 className="text-sm font-bold font-display mb-3">Order History</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o: any) => (
                  <Link key={o.id} href={`/orders/${o.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      o.service_type === "SOLAR" ? "bg-amber-500/15" : o.service_type === "TANK" ? "bg-blue-500/15" : "bg-green-500/15"
                    }`}>
                      {o.service_type === "SOLAR" ? <Sun className="w-3.5 h-3.5 text-amber-600" /> :
                       o.service_type === "TANK" ? <Droplets className="w-3.5 h-3.5 text-blue-600" /> :
                       <Activity className="w-3.5 h-3.5 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <p className="text-sm font-semibold text-primary">{formatCurrency(o.total_amount)}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
