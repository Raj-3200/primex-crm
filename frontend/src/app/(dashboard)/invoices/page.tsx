'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  XCircle,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

async function fetchInvoices() {
  const res = await fetch('/api/invoices', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  COMPLETED: {
    label: 'Paid',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    classes: 'text-emerald-700 bg-emerald-50',
  },
  PENDING: {
    label: 'Pending',
    icon: <Clock className="h-3.5 w-3.5" />,
    classes: 'text-yellow-700 bg-yellow-50',
  },
  SCHEDULED: {
    label: 'Scheduled',
    icon: <Clock className="h-3.5 w-3.5" />,
    classes: 'text-blue-700 bg-blue-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    classes: 'text-purple-700 bg-purple-50',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="h-3.5 w-3.5" />,
    classes: 'text-red-700 bg-red-50',
  },
};

export default function InvoicesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    staleTime: 1000 * 60 * 2,
  });

  const invoices = data?.invoices ?? [];

  const totalInvoiced = invoices.reduce(
    (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
    0
  );
  const paidInvoices = invoices.filter((inv: any) => inv.status === 'COMPLETED');
  const pendingInvoices = invoices.filter((inv: any) =>
    ['PENDING', 'SCHEDULED', 'IN_PROGRESS'].includes(inv.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All billing records for your service orders
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border shadow-sm p-6 bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl p-2.5 bg-orange-50">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalInvoiced)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
        </div>

        <div className="rounded-2xl border border-border shadow-sm p-6 bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl p-2.5 bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(
                paidInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{paidInvoices.length} paid</p>
        </div>

        <div className="rounded-2xl border border-border shadow-sm p-6 bg-card col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl p-2.5 bg-yellow-50">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(
                pendingInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{pendingInvoices.length} pending</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-border shadow-sm p-6 bg-card">
        <h2 className="text-base font-semibold text-foreground mb-4">Invoice List</h2>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-muted-foreground">Failed to load invoices. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invoices are generated when orders are created with amounts.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv: any) => {
                const status = statusConfig[inv.status] ?? statusConfig['PENDING'];
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-semibold text-orange-600">
                      INV-{inv.order_number}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {inv.customer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.customer_email || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">
                        {inv.service_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatCurrency(Number(inv.total_amount))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.classes}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(inv.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
