'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  XCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

async function fetchPayments() {
  const res = await fetch('/api/payments', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

const serviceTypeColors: Record<string, string> = {
  SOLAR: 'bg-yellow-100 text-yellow-700',
  TANK: 'bg-blue-100 text-blue-700',
  COMBINED: 'bg-purple-100 text-purple-700',
};

export default function PaymentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    staleTime: 1000 * 60 * 2,
  });

  const stats = data?.stats;
  const payments = data?.payments ?? [];

  const statCards = [
    {
      label: 'Total Collected',
      value: isLoading ? null : formatCurrency(stats?.totalCollected ?? 0),
      icon: <DollarSign className="h-5 w-5 text-orange-500" />,
      bg: 'bg-orange-50',
      sub: `${stats?.totalTransactions ?? 0} transactions`,
    },
    {
      label: 'This Month',
      value: isLoading ? null : formatCurrency(stats?.thisMonth ?? 0),
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      bg: 'bg-emerald-50',
      sub: `${stats?.thisMonthTransactions ?? 0} this month`,
    },
    {
      label: 'Total Transactions',
      value: isLoading ? null : String(stats?.totalTransactions ?? 0),
      icon: <CreditCard className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50',
      sub: 'Completed orders',
    },
    {
      label: 'Monthly Transactions',
      value: isLoading ? null : String(stats?.thisMonthTransactions ?? 0),
      icon: <Calendar className="h-5 w-5 text-violet-500" />,
      bg: 'bg-violet-50',
      sub: 'This month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Revenue collected from completed service orders
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border shadow-sm p-6 bg-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`rounded-xl p-2.5 ${card.bg}`}>{card.icon}</div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-28 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-border shadow-sm p-6 bg-card">
        <h2 className="text-base font-semibold text-foreground mb-4">Payment History</h2>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-muted-foreground">Failed to load payments. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Completed orders will appear here as payment records.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono font-medium text-orange-600">
                    #{payment.order_number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {payment.customer_name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        serviceTypeColors[payment.service_type] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {payment.service_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-700">
                    {formatCurrency(Number(payment.total_amount))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.completed_at ? formatDate(payment.completed_at) : '—'}
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
