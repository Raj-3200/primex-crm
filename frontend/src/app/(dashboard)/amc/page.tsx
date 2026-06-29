'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  RefreshCcw,
  CheckCircle2,
  Clock,
  IndianRupee,
  Eye,
  CalendarDays,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  total_amount: number;
  notes: string | null;
  customer_name: string;
  customer_city: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  revenue: number;
}

interface ApiResponse {
  orders: Order[];
  stats: Stats;
}

/** Compute a rough renewal date: 1 year after the order's created_at */
function getRenewalDate(createdAt: string): string {
  const d = new Date(createdAt);
  d.setFullYear(d.getFullYear() + 1);
  return formatDate(d.toISOString());
}

/** Determine if a contract is expiring within 30 days */
function isExpiringSoon(createdAt: string): boolean {
  const renewal = new Date(createdAt);
  renewal.setFullYear(renewal.getFullYear() + 1);
  const diffMs = renewal.getTime() - Date.now();
  return diffMs > 0 && diffMs < 30 * 24 * 60 * 60 * 1000;
}

const statCards = (stats: Stats) => [
  {
    label: 'Total Contracts',
    value: stats.total,
    icon: RefreshCcw,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    label: 'Active',
    value: stats.completed,
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    label: 'Pending',
    value: stats.pending,
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    label: 'Revenue',
    value: formatCurrency(stats.revenue),
    icon: IndianRupee,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    isString: true,
  },
];

export default function AmcPage() {
  const { accessToken } = useAuthStore();

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['amc-orders'],
    queryFn: async () => {
      const res = await fetch('/api/amc', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch AMC contracts');
      return res.json();
    },
    enabled: !!accessToken,
  });

  const orders = data?.orders ?? [];
  const stats: Stats = data?.stats ?? { total: 0, completed: 0, pending: 0, revenue: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <RefreshCcw className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Annual Maintenance Contracts</h1>
          <p className="text-sm text-muted-foreground">Manage combined solar &amp; tank AMC contracts</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border shadow-sm p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          : statCards(stats).map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border shadow-sm p-6 flex items-center gap-4"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} flex-shrink-0`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">
                    {card.isString ? card.value : card.value}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {/* Contracts Table Card */}
      <div className="rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">All AMC Contracts</h2>

        {isError && (
          <p className="text-sm text-destructive">Failed to load data. Please try again.</p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="No AMC contracts found"
            description="Annual maintenance contracts will appear here once created."
            icon={RefreshCcw}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> Renewal Date
                  </span>
                </TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium text-purple-600">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name ?? '—'}</p>
                      {order.customer_city && (
                        <p className="text-xs text-muted-foreground">{order.customer_city}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getRenewalDate(order.created_at)}</span>
                      {isExpiringSoon(order.created_at) && (
                        <Badge variant="destructive" className="text-xs">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.scheduled_date ? formatDate(order.scheduled_date) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
