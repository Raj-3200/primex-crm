"use client";
import { API_BASE } from "@/lib/backend";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") || "";
}

async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function markRead(payload: { id?: string; markAllRead?: boolean }) {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update notification");
  return res.json();
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 30,
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkOne = (id: string) => {
    markReadMutation.mutate({ id });
  };

  const handleMarkAll = () => {
    markReadMutation.mutate({ markAllRead: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? (
              <span className="text-orange-600 font-medium">
                {unreadCount} unread
              </span>
            ) : (
              "All caught up!"
            )}{" "}
            · {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markReadMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border shadow-sm p-6 bg-card flex items-center gap-4">
          <div className="rounded-xl p-3 bg-orange-50">
            <Bell className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-10 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {notifications.length}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Total Notifications</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border shadow-sm p-6 bg-card flex items-center gap-4">
          <div className="rounded-xl p-3 bg-yellow-50">
            <BellOff className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-10 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {unreadCount}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Unread</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            All Notifications
          </h2>
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 items-start">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see system alerts and updates here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={cn(
                  "px-6 py-4 flex gap-4 items-start transition-colors hover:bg-muted/30",
                  !notif.is_read && "bg-orange-50/50",
                )}
              >
                {/* Unread dot */}
                <div className="mt-1 flex-shrink-0">
                  {notif.is_read ? (
                    <Circle className="h-2.5 w-2.5 text-muted-foreground/30 fill-muted-foreground/20" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-orange-500 fill-orange-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          notif.is_read
                            ? "text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {notif.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(notif.created_at)}
                        </span>
                        {notif.full_name && (
                          <span className="text-xs text-muted-foreground">
                            · {notif.full_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkOne(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="flex-shrink-0 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors disabled:opacity-50 mt-0.5"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
