'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  Briefcase,
  Wrench,
  CheckCircle2,
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
import { formatDate } from '@/lib/utils';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

async function fetchEmployees() {
  const res = await fetch('/api/employees', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
  TECHNICIAN: 'bg-green-100 text-green-700 border-green-200',
};

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <ShieldCheck className="h-3 w-3" />,
  MANAGER: <Briefcase className="h-3 w-3" />,
  TECHNICIAN: <Wrench className="h-3 w-3" />,
};

export default function EmployeesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    staleTime: 1000 * 60 * 2,
  });

  const stats = data?.stats;
  const employees = data?.employees ?? [];

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.total ?? 0,
      icon: <Users className="h-5 w-5 text-orange-500" />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Admins',
      value: stats?.admins ?? 0,
      icon: <ShieldCheck className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-50',
    },
    {
      label: 'Managers',
      value: stats?.managers ?? 0,
      icon: <Briefcase className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Technicians',
      value: stats?.technicians ?? 0,
      icon: <Wrench className="h-5 w-5 text-green-500" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employees</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your team members and their roles
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border shadow-sm p-6 bg-card flex items-center gap-4"
          >
            <div className={`rounded-xl p-3 ${card.bg}`}>{card.icon}</div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-border shadow-sm p-6 bg-card">
        <h2 className="text-base font-semibold text-foreground mb-4">All Employees</h2>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-muted-foreground">Failed to load employees. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No employees found</p>
            <p className="text-sm text-muted-foreground mt-1">Add employees to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium text-foreground">
                    {emp.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        roleColors[emp.role] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {roleIcons[emp.role]}
                      {emp.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {emp.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <XCircle className="h-3.5 w-3.5" />
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(emp.created_at)}
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
