"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: string;
  type: string;
  title: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const typeIcon: Record<string, string> = {
  LOW_FLOAT:    "ti-alert-triangle",
  DAILY_REPORT: "ti-chart-bar",
  WELCOME:      "ti-confetti",
  SYSTEM:       "ti-info-circle",
};

const typeColor: Record<string, string> = {
  LOW_FLOAT:    "text-red-400",
  DAILY_REPORT: "text-blue-400",
  WELCOME:      "text-green-400",
  SYSTEM:       "text-white/50",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications?limit=15").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount ?? 0;

  const markAllMutation = useMutation({
    mutationFn: () => fetch("/api/notifications", { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-[10px] text-white/55 hover:bg-white/5 hover:text-white/85 transition-all"
        aria-label="Notifications"
      >
        <i className="ti ti-bell text-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E040A0] text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-80 rounded-[14px] border shadow-2xl z-50 overflow-hidden"
          style={{
            background: "#1A1A24",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-bold text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-[#E040A0]">{unreadCount} unread</span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <i className="ti ti-bell-off text-[28px] text-white/15 mb-2 block" />
                <p className="text-xs text-white/30">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markOneMutation.mutate(n.id);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-colors hover:bg-white/3 ${
                    n.isRead ? "opacity-50" : ""
                  }`}
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <i className={`ti ${typeIcon[n.type] ?? "ti-info-circle"} ${typeColor[n.type] ?? "text-white/50"} text-[16px] mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    {n.title && (
                      <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                    )}
                    <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-white/25 mt-1">
                      {new Date(n.createdAt).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E040A0] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
