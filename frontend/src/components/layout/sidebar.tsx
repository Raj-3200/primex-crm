"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Sun,
  Droplets,
  RefreshCcw,
  Calendar,
  UserCheck,
  CreditCard,
  FileText,
  FilePenLine,
  Quote,
  TrendingUp,
  BarChart3,
  FolderOpen,
  Bell,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Solar Cleaning", href: "/solar", icon: Sun },
      { label: "Tank Cleaning", href: "/tanks", icon: Droplets },
      { label: "AMC Contracts", href: "/amc", icon: RefreshCcw },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Invoices", href: "/invoices", icon: FileText },
      { label: "Quotations", href: "/quotations", icon: Quote },
      { label: "Contracts", href: "/contracts", icon: FilePenLine },
      { label: "Expenses", href: "/expenses", icon: TrendingUp },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Employees", href: "/employees", icon: UserCheck },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Documents", href: "/documents", icon: FolderOpen },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface NavItemProps {
  item: { label: string; href: string; icon: React.ElementType };
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ item, isCollapsed, isActive, onClick }: NavItemProps) {
  const Icon = item.icon;
  const content = (
    <motion.div
      whileHover={{ x: isCollapsed ? 0 : 2 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-premium"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon
          className={cn(
            "shrink-0 transition-all",
            isCollapsed ? "w-5 h-5" : "w-4.5 h-4.5",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Active indicator pill */}
        {isActive && !isCollapsed && (
          <motion.div
            layoutId="active-pill"
            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/60"
          />
        )}
      </Link>
    </motion.div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border shrink-0 z-30"
      >
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            isCollapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-premium shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="font-bold text-sm leading-none text-sidebar-foreground font-display">
                  PrimeX
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">
                  Services CRM
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label}>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── User Footer ───────────────────────────────────────────── */}
        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                {user ? getInitials(user.full_name) : "PX"}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden min-w-0"
                >
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.full_name || "Admin"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.role || "ADMIN"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>


      </motion.aside>
    </TooltipProvider>
  );
}
