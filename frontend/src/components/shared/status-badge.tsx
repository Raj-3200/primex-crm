"use client";

import { cn } from "@/lib/utils";

type StatusVariant =
  | "PENDING"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "ACTIVE"
  | "INACTIVE"
  | "ADMIN"
  | "MANAGER"
  | "TECHNICIAN"
  | "SOLAR"
  | "TANK"
  | "COMBINED";

const statusConfig: Record<
  StatusVariant,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
    dot: "bg-green-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
    dot: "bg-red-500",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
    dot: "bg-green-500",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    dot: "bg-gray-500",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  MANAGER: {
    label: "Manager",
    className: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  TECHNICIAN: {
    label: "Technician",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  SOLAR: {
    label: "Solar",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  TANK: {
    label: "Tank",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  COMBINED: {
    label: "Combined",
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
    dot: "bg-green-500",
  },
};

interface StatusBadgeProps {
  status: StatusVariant | string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status as StatusVariant] ?? {
    label: status,
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
