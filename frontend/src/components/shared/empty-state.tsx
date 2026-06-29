"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = PackageOpen,
  iconClassName = "text-muted-foreground",
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5 animate-float">
        <Icon className={`w-9 h-9 ${iconClassName}`} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
}
