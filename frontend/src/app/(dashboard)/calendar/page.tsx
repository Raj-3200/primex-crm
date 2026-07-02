"use client";
import { API_BASE } from "@/lib/backend";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sun,
  Droplets,
  Zap,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";

interface CalendarJob {
  id: string;
  order_number: string;
  service_type: "SOLAR" | "TANK" | "COMBINED";
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  total_amount: number;
  customer_name: string;
}

const SERVICE_COLORS = {
  SOLAR: {
    pill: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30",
    dot: "bg-amber-500",
    icon: Sun,
    iconColor: "text-amber-500",
  },
  TANK: {
    pill: "bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30",
    dot: "bg-blue-500",
    icon: Droplets,
    iconColor: "text-blue-500",
  },
  COMBINED: {
    pill: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: Zap,
    iconColor: "text-emerald-500",
  },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function fetchCalendar(): Promise<{ jobs: CalendarJob[] }> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || ""
      : "";
  const res = await fetch(`${API_BASE}/calendar`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch calendar data");
  return res.json();
}

function JobPill({ job }: { job: CalendarJob }) {
  const config = SERVICE_COLORS[job.service_type] || SERVICE_COLORS.SOLAR;
  const Icon = config.icon;
  return (
    <Link href={`/orders/${job.id}`}>
      <div
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity",
          config.pill
        )}
        title={`${job.order_number} — ${job.customer_name}`}
      >
        <Icon className={cn("w-2.5 h-2.5 flex-shrink-0", config.iconColor)} />
        <span className="truncate">{job.order_number}</span>
      </div>
    </Link>
  );
}

function CalendarCell({
  date,
  jobs,
  isCurrentMonth,
  isSelected,
  onClick,
}: {
  date: Date;
  jobs: CalendarJob[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const today = isToday(date);
  const visibleJobs = jobs.slice(0, 3);
  const overflow = jobs.length - 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[90px] p-1.5 border-b border-r border-border/50 cursor-pointer transition-colors",
        isCurrentMonth
          ? "bg-background hover:bg-muted/30"
          : "bg-muted/10 opacity-50",
        isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
      )}
    >
      <div className="flex items-center justify-center mb-1">
        <span
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            today
              ? "bg-primary text-primary-foreground"
              : isSelected
              ? "text-primary font-bold"
              : "text-foreground"
          )}
        >
          {format(date, "d")}
        </span>
      </div>
      <div className="space-y-0.5">
        {visibleJobs.map((job) => (
          <JobPill key={job.id} job={job} />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground pl-1">
            +{overflow} more
          </p>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: fetchCalendar,
    staleTime: 60_000,
  });

  const jobs = data?.jobs ?? [];

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const map = new Map<string, CalendarJob[]>();
    for (const job of jobs) {
      if (!job.scheduled_date) continue;
      const key = job.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(job);
    }
    return map;
  }, [jobs]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Jobs for selected date or upcoming jobs
  const selectedJobs = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return jobsByDate.get(key) || [];
  }, [selectedDate, jobsByDate]);

  // Upcoming jobs (next 30 days)
  const upcomingJobs = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return jobs
      .filter((j) => j.scheduled_date && j.scheduled_date >= today)
      .slice(0, 15);
  }, [jobs]);

  const displayJobs = selectedDate ? selectedJobs : upcomingJobs;
  const displayTitle = selectedDate
    ? `Jobs on ${format(selectedDate, "d MMMM yyyy")}`
    : "Upcoming Jobs (Next 30 Days)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading schedule…"
              : `${jobs.length} scheduled jobs`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Solar
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Tank
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Combined
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-semibold font-display">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[90px] p-2 border-b border-r border-border/50"
              >
                <Skeleton className="h-4 w-4 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-full rounded-md mb-1" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const key = format(date, "yyyy-MM-dd");
              const dayJobs = jobsByDate.get(key) || [];
              const isSelected =
                selectedDate ? isSameDay(date, selectedDate) : false;
              return (
                <CalendarCell
                  key={key}
                  date={date}
                  jobs={dayJobs}
                  isCurrentMonth={isSameMonth(date, currentMonth)}
                  isSelected={isSelected}
                  onClick={() =>
                    setSelectedDate((prev) =>
                      prev && isSameDay(prev, date) ? null : date
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Job List */}
      <div className="rounded-2xl border border-border shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold font-display">{displayTitle}</h2>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => setSelectedDate(null)}
            >
              Clear selection
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayJobs.length === 0 ? (
          <EmptyState
            title={selectedDate ? "No jobs on this day" : "No upcoming jobs"}
            description={
              selectedDate
                ? "There are no scheduled jobs for this date."
                : "No jobs scheduled in the next 30 days."
            }
            icon={CalendarDays}
          />
        ) : (
          <div className="divide-y divide-border/50">
            {displayJobs.map((job, i) => {
              const config =
                SERVICE_COLORS[job.service_type] || SERVICE_COLORS.SOLAR;
              const Icon = config.icon;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Service Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      job.service_type === "SOLAR"
                        ? "bg-amber-500/10"
                        : job.service_type === "TANK"
                        ? "bg-blue-500/10"
                        : "bg-emerald-500/10"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", config.iconColor)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${job.id}`}
                        className="font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {job.order_number}
                      </Link>
                      <StatusBadge status={job.status} showDot={false} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {job.customer_name}
                      </span>
                      {job.scheduled_time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {job.scheduled_time}
                        </span>
                      )}
                      {!selectedDate && job.scheduled_date && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(job.scheduled_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(job.total_amount)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
