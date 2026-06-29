"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, Tag,
  Edit, Trash2, ExternalLink, ShoppingBag, Clock,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCustomer,
  useCustomerTimeline,
  useDeleteCustomer,
} from "@/features/customers/hooks/use-customers";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate, formatDateTime, getInitials, timeAgo } from "@/lib/utils";

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: timeline } = useCustomerTimeline(id);
  const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();

  const handleDelete = () => {
    deleteCustomer(id, {
      onSuccess: () => {
        toast.success("Customer deleted");
        router.push("/customers");
      },
    });
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been deleted or the ID is incorrect."
        icon={ShoppingBag}
        action={
          <Button asChild>
            <Link href="/customers">Back to Customers</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/customers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">{customer.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {customer.customer_id}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Customer since {formatDate(customer.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={`/customers/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl shadow-premium">
            <Link href={`/orders/new?customer=${id}`}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              New Order
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  This will soft-delete {customer.name}. Their data will be
                  retained and can be restored by an admin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Delete Customer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile + Stats */}
        <div className="space-y-4">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 rounded-2xl">
              <div className="flex flex-col items-center text-center mb-5">
                <Avatar className="w-20 h-20 rounded-2xl mb-3">
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold font-display">{customer.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={customer.property_type} />
                  <StatusBadge status={customer.lead_source} showDot={false} />
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{customer.phone}</p>
                    {customer.alternate_phone && (
                      <p className="text-xs text-muted-foreground">{customer.alternate_phone}</p>
                    )}
                  </div>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm">{customer.email}</p>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm">{customer.address}</p>
                </div>

                {customer.maps_url && (
                  <a
                    href={customer.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Google Maps
                  </a>
                )}

                {customer.gst_number && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-mono">{customer.gst_number}</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="p-6 rounded-2xl">
              <h3 className="text-sm font-bold font-display mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {customer.total_orders}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Orders</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/15">
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {formatCurrency(customer.total_spent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
                </div>
              </div>

              {customer.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm text-foreground">{customer.notes}</p>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Right: Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-2"
        >
          <Card className="p-6 rounded-2xl h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold font-display">Activity Timeline</h2>
              <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
                <Link href={`/orders?customer=${id}`}>
                  <ShoppingBag className="w-3 h-3 mr-1.5" />
                  View Orders
                </Link>
              </Button>
            </div>

            {!timeline || timeline.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Actions for this customer will appear here"
                icon={Clock}
              />
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-0">
                  {timeline.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-4 pb-6 relative"
                    >
                      {/* Dot */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {timeAgo(event.date)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
