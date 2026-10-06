// UI-only redesign: Restyled reservation calendar view with refined grid, badges, and detail drawer
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Clock, Users, CalendarDays, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { refreshAuthToken } from "@/lib/client/auth-token";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests: string | null;
  status: string;
  user: { name: string | null; email: string; phone: string | null };
  payment: { orderItems: OrderItem[] | null; amount: number; status: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500 text-white",
  CONFIRMED: "bg-emerald-600 text-white",
  COMPLETED: "bg-slate-600 text-white",
  CANCELLED: "bg-rose-600 text-white",
  NO_SHOW: "bg-orange-600 text-white",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReservationCalendar() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${lastDay}`;
    const res = await fetch(`/api/proxy/restaurant-portal/reservations?from=${from}&to=${to}&limit=500`);
    if (res.ok) {
      const data = await res.json() as { data: Reservation[] };
      setReservations(data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void fetchMonth(year, month), 0);
    return () => window.clearTimeout(initialFetch);
  }, [year, month, fetchMonth]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Group by date string
  const byDate: Record<string, Reservation[]> = {};
  for (const r of reservations) {
    const key = r.date.slice(0, 10);
    (byDate[key] ??= []).push(r);
  }

  const selectedReservations = selectedDate ? (byDate[selectedDate] ?? []) : [];

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const token = await refreshAuthToken(true);
      if (!token) return;
      const response = await fetch(`/api/proxy/restaurant-portal/reservations/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return;
      await fetchMonth(year, month);
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1 rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-muted/30">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="size-8 rounded-xl hover:bg-muted">
            <ChevronLeft className="size-4 text-muted-foreground" />
          </Button>
          <h2 className="font-heading text-lg font-bold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="size-8 rounded-xl hover:bg-muted">
            <ChevronRight className="size-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-border/70 bg-muted/20 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
          {DAYS.map((d) => (
            <div key={d} className="py-2.5">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-72 text-muted-foreground text-sm font-medium animate-pulse">
            Loading reservations calendar…
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[96px] bg-muted/15" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayRes = byDate[dateStr] ?? [];
              const isToday = toLocalDateStr(today) === dateStr;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`min-h-[96px] p-2 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-emerald-500/10 ring-2 ring-inset ring-emerald-500 dark:bg-emerald-950/30"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className={`text-xs font-bold mb-1.5 size-7 flex items-center justify-center rounded-xl transition-all ${
                    isToday
                      ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                      : "text-foreground"
                  }`}>
                    {day}
                  </div>

                  {dayRes.length > 0 && (
                    <div className="space-y-1">
                      {dayRes.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className={`text-[0.66rem] font-bold rounded-md px-1.5 py-0.5 truncate shadow-2xs ${STATUS_COLORS[r.status] ?? "bg-muted-foreground text-white"}`}
                        >
                          {r.time} · {r.user.name ?? r.user.email.split("@")[0]}
                        </div>
                      ))}
                      {dayRes.length > 2 && (
                        <div className="text-[0.66rem] font-extrabold text-emerald-600 dark:text-emerald-400 pl-1">
                          +{dayRes.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-t border-border/70 bg-muted/20 text-xs font-semibold text-muted-foreground">
          {Object.entries(STATUS_COLORS).map(([s, cls]) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`inline-block size-2.5 rounded-full ${cls}`} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side detail panel */}
      {selectedDate && (
        <div className="w-full xl:w-96 rounded-2xl border border-border/80 bg-card shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-muted/30">
            <span className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="size-4 text-emerald-600" />
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric",
              })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)} className="size-7 rounded-lg hover:bg-muted">
              <X className="size-4 text-muted-foreground" />
            </Button>
          </div>

          {selectedReservations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground text-sm text-center gap-2">
              <CalendarDays className="size-8 opacity-40" />
              <p className="font-semibold text-foreground">No bookings on this day</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[500px]">
              {selectedReservations
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((r) => (
                  <div key={r.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {r.user.name ?? r.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.user.phone ?? r.user.email}</div>
                      </div>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"} className="text-[0.68rem] font-bold uppercase tracking-wider shrink-0">
                        {r.status}
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-muted-foreground flex gap-4">
                      <span className="flex items-center gap-1"><Clock className="size-3 text-emerald-600" /> {r.time}</span>
                      <span className="flex items-center gap-1"><Users className="size-3 text-emerald-600" /> {r.partySize} guests</span>
                    </div>

                    {r.specialRequests && (
                      <div className="text-xs text-muted-foreground italic bg-muted/40 p-2 rounded-lg border border-border/50">
                        &ldquo;{r.specialRequests}&rdquo;
                      </div>
                    )}

                    {r.payment?.orderItems && r.payment.orderItems.length > 0 && (
                      <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Utensils className="size-3 text-emerald-600" /> Pre-Order Summary
                        </div>
                        {r.payment.orderItems.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span><span className="font-bold text-foreground">{item.quantity}×</span> {item.name}</span>
                            <span className="font-mono text-foreground">LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold text-foreground border-t border-border/60 pt-1.5 mt-1.5">
                          <span>Total Paid</span>
                          <span className="text-emerald-600 dark:text-emerald-400">LKR {r.payment.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <select
                      defaultValue={r.status}
                      disabled={updatingId === r.id}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {["PENDING","CONFIRMED","COMPLETED","CANCELLED","NO_SHOW"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-border/70 bg-muted/30 text-xs font-bold text-muted-foreground">
            {selectedReservations.length} reservation{selectedReservations.length !== 1 ? "s" : ""}
            {" · "}
            {selectedReservations.reduce((n, r) => n + r.partySize, 0)} total guests
          </div>
        </div>
      )}
    </div>
  );
}
