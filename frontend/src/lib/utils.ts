import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/** Merge Tailwind classes with clsx. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a number with Indian number system (1,00,000). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Smart date formatter: "Today", "Yesterday", or formatted date. */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
}

/** Format date with time. */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy, h:mm a");
}

/** "2 hours ago", "3 days ago" etc. */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/** Generate initials from a name. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Truncate a string to a max length. */
export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max) + "…";
}

/** Extract error message from an Axios error or unknown. */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (e.response && typeof e.response === "object") {
      const r = e.response as Record<string, unknown>;
      if (r.data && typeof r.data === "object") {
        const d = r.data as Record<string, unknown>;
        if (typeof d.detail === "string") return d.detail;
        if (Array.isArray(d.errors) && d.errors.length > 0) {
          return (d.errors[0] as Record<string, string>).message;
        }
      }
    }
    if (typeof e.message === "string") return e.message;
  }
  return "An unexpected error occurred";
}
