"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Bell, CalendarCheck, Check, CheckCheck, CircleAlert,
  Clock3, CreditCard, Inbox, Loader2, Megaphone, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

type Filter = "all" | "unread";

function getNotificationMeta(type: string) {
  if (type.startsWith("PAYMENT")) return {
    icon: CreditCard,
    label: "Payment",
    iconClass: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/15 dark:text-emerald-300",
  };
  if (type === "WAITLIST_AVAILABLE") return {
    icon: Clock3,
    label: "Waitlist",
    iconClass: "bg-amber-500/10 text-amber-700 ring-amber-600/15 dark:text-amber-300",
  };
  if (type === "REVIEW_RECEIVED") return {
    icon: Star,
    label: "Review",
    iconClass: "bg-[#D4B57D]/20 text-[#765A2C] ring-[#B08D57]/20 dark:text-[#E4C98F]",
  };
  if (type === "PROMOTION" || type === "SYSTEM_ANNOUNCEMENT") return {
    icon: Megaphone,
    label: type === "PROMOTION" ? "Offer" : "Announcement",
    iconClass: "bg-violet-500/10 text-violet-700 ring-violet-600/15 dark:text-violet-300",
  };
  if (type === "RESERVATION_CANCELLED") return {
    icon: CircleAlert,
    label: "Booking",
    iconClass: "bg-red-500/10 text-red-700 ring-red-600/15 dark:text-red-300",
  };
  return {
    icon: CalendarCheck,
    label: "Booking",
    iconClass: "bg-primary/10 text-primary ring-primary/15",
  };
}

function getNotificationLink(notification: Notification, audience: "customer" | "restaurant") {
  const restaurantId = typeof notification.data?.restaurantId === "string"
    ? notification.data.restaurantId
    : null;

  if (notification.type === "WAITLIST_AVAILABLE" && restaurantId) {
    return { href: `/restaurants/${restaurantId}`, label: "View restaurant" };
  }
  if (notification.type === "PROMOTION" && restaurantId) {
    return { href: `/restaurants/${restaurantId}`, label: "View offer" };
  }
  if (notification.type === "REVIEW_RECEIVED") {
    return { href: "/profile", label: "View review" };
  }
  if (notification.type.startsWith("PAYMENT") || notification.type.startsWith("RESERVATION")) {
    return {
      href: audience === "restaurant" ? "/restaurant/reservations" : "/reservations",
      label: audience === "restaurant" ? "Review booking" : "View booking",
    };
  }
  return null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-LK", {
      day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo",
    }),
    time: date.toLocaleTimeString("en-LK", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo",
    }),
  };
}

function NotificationCard({ notification, marking, onMarkRead, audience }: {
  notification: Notification;
  marking: boolean;
  onMarkRead: (id: string) => void;
  audience: "customer" | "restaurant";
}) {
  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const action = getNotificationLink(notification, audience);
  const timestamp = formatDate(notification.createdAt);

  return (
    <article className={cn(
      "group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 sm:p-5",
      notification.isRead
        ? "border-border/70 hover:border-primary/20 hover:shadow-md"
        : "border-primary/25 bg-gradient-to-r from-primary/[0.07] via-card to-card shadow-primary/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
    )}>
      {!notification.isRead && <div className="absolute inset-y-0 left-0 w-1 bg-primary" />}
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-2xl ring-1", meta.iconClass)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/75">{meta.label}</span>
                {!notification.isRead && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    <span className="size-1.5 rounded-full bg-white" /> New
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-base font-bold leading-snug text-foreground sm:text-lg">{notification.title}</h3>
            </div>
            <time className="shrink-0 text-xs leading-5 text-muted-foreground" dateTime={notification.createdAt}>
              <span className="font-medium text-foreground/70">{timestamp.date}</span>
              <span className="ml-2">{timestamp.time}</span>
            </time>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{notification.message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {action && (
              <Button asChild size="sm" variant={notification.isRead ? "outline" : "default"} className="rounded-full">
                <Link href={action.href} onClick={() => !notification.isRead && onMarkRead(notification.id)}>
                  {action.label} <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
            {!notification.isRead && (
              <Button type="button" size="sm" variant="ghost" className="rounded-full text-muted-foreground"
                disabled={marking} onClick={() => onMarkRead(notification.id)}>
                {marking ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function NotificationsList({ initial, unreadCount: initialUnread, audience = "customer" }: {
  initial: Notification[];
  unreadCount: number;
  audience?: "customer" | "restaurant";
}) {
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const markRead = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target || target.isRead || markingId === id) return;
    setMarkingId(id);
    try {
      const response = await fetch(`/api/proxy/users/me/notifications/${id}/read`, { method: "PATCH" });
      if (!response.ok) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((count) => Math.max(0, count - 1));
    } finally {
      setMarkingId(null);
    }
  };

  const markAllRead = async () => {
    if (markingAll || unread === 0) return;
    setMarkingAll(true);
    try {
      const response = await fetch("/api/proxy/users/me/notifications/read-all", { method: "PATCH" });
      if (!response.ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const visibleItems = useMemo(
    () => filter === "unread" ? items.filter((item) => !item.isRead) : items,
    [filter, items],
  );
  const newItems = visibleItems.filter((item) => !item.isRead);
  const earlierItems = visibleItems.filter((item) => item.isRead);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-[#47131F] via-[#641D30] to-[#2C171C] px-6 py-7 text-white shadow-xl shadow-primary/10 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#D4B57D]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#E7C98F] backdrop-blur-sm">
              <Bell className="size-3.5" /> Your activity
            </div>
            <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Notifications</h1>
            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
              {audience === "restaurant"
                ? "Paid bookings that need confirmation, cancellations, guest activity, and operational updates."
                : "Booking updates, payment confirmations, waitlist alerts, and restaurant news—all in one place."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">{unread}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Unread</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Total</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-full border border-border bg-card p-1 shadow-sm">
          {(["all", "unread"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors",
              filter === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}>
              {value} {value === "unread" && unread > 0 ? `(${unread})` : ""}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <Button variant="ghost" className="w-fit rounded-full" disabled={markingAll} onClick={() => void markAllRead()}>
            {markingAll ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/50 px-6 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Inbox className="size-7" /></div>
          <h2 className="mt-5 text-xl font-bold">You’re all caught up</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Booking confirmations, payment updates, and special offers will appear here.</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/50 px-6 text-center">
          <CheckCheck className="size-9 text-primary" />
          <h2 className="mt-4 text-lg font-bold">No unread notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">You have reviewed every update.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {newItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">New</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{newItems.length}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {newItems.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} marking={markingId === notification.id} onMarkRead={(id) => void markRead(id)} audience={audience} />
              ))}
            </section>
          )}
          {earlierItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">Earlier</h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              {earlierItems.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} marking={markingId === notification.id} onMarkRead={(id) => void markRead(id)} audience={audience} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
