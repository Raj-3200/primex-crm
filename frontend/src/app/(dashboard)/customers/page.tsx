"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Search, Users, Phone, MapPin, Building2, Filter } from "lucide-react";

import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks/use-customers";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Customer } from "@/features/customers/types";

function CustomerCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border space-y-3 animate-pulse">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  onDelete: (id: string) => void;
}

function CustomerCard({ customer, onDelete }: CustomerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      className="bg-card rounded-2xl border border-border p-5 hover:shadow-premium transition-all cursor-pointer"
    >
      <Link href={`/customers/${customer.id}`} className="block">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10 rounded-xl shrink-0">
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate text-sm">
                {customer.name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {customer.customer_id}
            </p>
          </div>
          <StatusBadge status={customer.property_type} showDot={false} />
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{customer.phone}</span>
            {customer.alternate_phone && (
              <span className="text-muted-foreground/60">· {customer.alternate_phone}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{customer.address}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-xs font-bold text-foreground tabular-nums">
                {customer.total_orders}
              </p>
              <p className="text-[10px] text-muted-foreground">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-foreground tabular-nums">
                {formatCurrency(customer.total_spent)}
              </p>
              <p className="text-[10px] text-muted-foreground">Total Spent</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Added {formatDate(customer.created_at)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [leadSource, setLeadSource] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers({
    page,
    per_page: 24,
    search: search || undefined,
    property_type: propertyType || undefined,
    lead_source: leadSource || undefined,
  });

  const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} customers` : "Loading…"}
          </p>
        </div>
        <Button asChild className="shadow-premium">
          <Link href="/customers/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={propertyType} onValueChange={(v) => { setPropertyType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={leadSource} onValueChange={(v) => { setLeadSource(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Lead Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
            <SelectItem value="WALK_IN">Walk In</SelectItem>
            <SelectItem value="COLD_CALL">Cold Call</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CustomerCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          title="No customers found"
          description={
            search
              ? "No customers match your search. Try different keywords."
              : "Add your first customer to get started."
          }
          icon={Users}
          action={
            !search ? (
              <Button asChild>
                <Link href="/customers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onDelete={setDeleteId}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pages}
              </span>
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
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the customer. Their data is retained but they
              will no longer appear in lists. This action can be reversed by an
              admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
              disabled={isDeleting}
              onClick={() => {
                if (deleteId) {
                  deleteCustomer(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
