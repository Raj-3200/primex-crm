"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "plain";
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: "orange" | "amber" | "green" | "blue" | "purple";
  suffix?: string;
  className?: string;
}

const variantClasses: Record<string, string> = {
  orange: "stat-orange",
  amber: "stat-amber",
  green: "stat-green",
  blue: "stat-blue",
  purple: "bg-purple-500/10 border-purple-500/20",
};

const iconClasses: Record<string, string> = {
  orange: "bg-primary/15 text-primary",
  amber: "bg-amber-500/15 text-amber-600",
  green: "bg-green-600/15 text-green-600",
  blue: "bg-blue-500/15 text-blue-600",
  purple: "bg-purple-500/15 text-purple-600",
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

export function StatCard({
  title,
  value,
  format = "currency",
  icon: Icon,
  change,
  changeLabel,
  variant = "orange",
  suffix,
  className,
}: StatCardProps) {
  const animatedValue = useCountUp(value);

  const displayValue = () => {
    if (format === "currency") return formatCurrency(animatedValue);
    if (format === "number") return formatNumber(Math.round(animatedValue));
    return Math.round(animatedValue).toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-2xl border p-5 overflow-hidden transition-shadow hover:shadow-premium",
        variantClasses[variant],
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current opacity-5 blur-2xl" />

      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums text-foreground truncate">
            {displayValue()}
            {suffix && (
              <span className="text-sm font-medium text-muted-foreground ml-1">
                {suffix}
              </span>
            )}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "text-xs font-medium",
                change >= 0 ? "text-green-600" : "text-destructive"
              )}
            >
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%{" "}
              <span className="text-muted-foreground font-normal">
                {changeLabel || "vs last month"}
              </span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3",
            iconClasses[variant]
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}
