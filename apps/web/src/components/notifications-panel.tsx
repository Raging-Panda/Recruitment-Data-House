"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import type { NotificationItem, NotificationType } from "@ipskill/shared";
import { BellIcon, ShieldCheckIcon, LayersIcon, StarIcon, CheckCircleIcon } from "./icons";
import { formatRelativeTime } from "@/lib/format";

const TYPE_ICON: Record<NotificationType, ComponentType<{ size?: number }>> = {
  experience_added: LayersIcon,
  certification_added: ShieldCheckIcon,
  skill_test_completed: StarIcon,
  welcome: CheckCircleIcon,
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:text-heading"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-pink px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-surface-border bg-background-elevated shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <p className="text-sm font-semibold text-heading">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <p className="p-4 text-center text-sm text-text-secondary">Loading…</p>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-text-secondary">No notifications yet</p>
            )}
            {notifications.map((notification) => {
              const Icon = TYPE_ICON[notification.type];
              const content = (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heading">{notification.title}</p>
                    {notification.body && (
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-text-muted">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </>
              );

              return notification.link ? (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => {
                    if (!notification.isRead) markRead(notification.id);
                    setIsOpen(false);
                  }}
                  className="flex items-start gap-3 border-b border-surface-border/50 px-4 py-3 transition last:border-b-0 hover:bg-surface"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markRead(notification.id)}
                  className="flex cursor-pointer items-start gap-3 border-b border-surface-border/50 px-4 py-3 transition last:border-b-0 hover:bg-surface"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
