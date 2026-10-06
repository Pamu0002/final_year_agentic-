"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refreshAuthToken } from "@/lib/client/auth-token";

interface Holiday {
  id: string;
  date: string;
  endDate: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

const REASON_PRESETS = ["Public holiday", "Private event", "Maintenance", "Staff event"];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", options ?? {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateRange(start: string, end?: string | null) {
  const startDate = start.slice(0, 10);
  const endDate = end?.slice(0, 10) ?? startDate;
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate, { day: "numeric", month: "short", year: "numeric" })} – ${formatDate(endDate, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function HolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("15:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingDate, setRemovingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const today = getLocalDateString();

  useEffect(() => {
    fetch("/api/proxy/restaurant-portal/holidays", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load closing dates");
        return response.json() as Promise<Holiday[]>;
      })
      .then((data) => setHolidays(data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load closing dates");
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  );
  const upcoming = sortedHolidays.filter((holiday) => (holiday.endDate ?? holiday.date).slice(0, 10) >= today);
  const nextClosure = upcoming[0];

  async function getAuthHeaders() {
    const token = await refreshAuthToken(true);
    if (!token) throw new Error("Your session has ended. Please sign in again.");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!date) return;
    if (date < today) {
      setError("Choose today or a future date.");
      return;
    }
    const finalEndDate = endDate || date;
    if (finalEndDate < date) {
      setError("End date cannot be before the start date.");
      return;
    }
    if (!allDay && endTime <= startTime) {
      setError("Closing end time must be later than its start time.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/proxy/restaurant-portal/holidays", {
        method: "POST",
        headers,
        body: JSON.stringify({
          date,
          endDate: finalEndDate,
          allDay,
          startTime: allDay ? undefined : startTime,
          endTime: allDay ? undefined : endTime,
          reason: reason.trim() || undefined,
        }),
      });
      const result = await response.json() as Holiday & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to schedule closing date");
      setHolidays((current) => [...current.filter((item) => item.date.slice(0, 10) !== date), result]);
      setSuccess(`${formatDateRange(date, finalEndDate)} is now ${allDay ? "closed all day" : `closed from ${startTime} to ${endTime}`}.`);
      setDate("");
      setEndDate("");
      setAllDay(true);
      setReason("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to schedule closing date");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (dateStr: string) => {
    const holiday = holidays.find((item) => item.date.slice(0, 10) === dateStr);
    if (!window.confirm(`Remove the closure for ${formatDateRange(dateStr, holiday?.endDate)}?`)) return;
    setRemovingDate(dateStr);
    setError(null);
    setSuccess(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/proxy/restaurant-portal/holidays/${dateStr}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "Unable to remove closing date");
      }
      setHolidays((current) => current.filter((holiday) => holiday.date.slice(0, 10) !== dateStr));
      setSuccess(`${formatDate(dateStr)} is open for bookings again.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove closing date");
    } finally {
      setRemovingDate(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-border/70 bg-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Loading closing dates…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarOff className="size-5" /></span>
            <div><p className="text-2xl font-bold text-foreground">{upcoming.length}</p><p className="text-xs font-medium text-muted-foreground">Upcoming closures</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent-foreground"><CalendarDays className="size-5" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{nextClosure ? formatDate(nextClosure.date, { day: "numeric", month: "short", year: "numeric" }) : "None scheduled"}</p>
              <p className="text-xs font-medium text-muted-foreground">Next closing date</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-5" /></span>
            <div><p className="text-sm font-bold text-foreground">Availability protected</p><p className="text-xs font-medium text-muted-foreground">Closed dates block new bookings</p></div>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"}`}>
          {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span>{error ?? success}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(340px,0.8fr)_minmax(480px,1.2fr)]">
        <form onSubmit={add} className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20"><CalendarOff className="size-5" /></span>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Schedule a closure</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Block one day, a date range, or only selected hours.</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label>Closure type</Label>
              <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1">
                <button type="button" onClick={() => setAllDay(true)} className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${allDay ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  All day
                </button>
                <button type="button" onClick={() => setAllDay(false)} className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${!allDay ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  Selected hours
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hdate">Start date</Label>
                <Input id="hdate" type="date" min={today} value={date} onChange={(event) => { setDate(event.target.value); if (!endDate || endDate < event.target.value) setEndDate(event.target.value); }} required className="h-12 rounded-xl border-border/80 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="henddate">End date</Label>
                <Input id="henddate" type="date" min={date || today} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 rounded-xl border-border/80 px-4" />
              </div>
            </div>

            {!allDay && (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground">
                  <Clock3 className="size-4 text-primary" /> Closed during these hours
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="hstarttime">From</Label>
                    <Input id="hstarttime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required className="h-11 rounded-xl border-border/80 px-3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hendtime">Until</Label>
                    <Input id="hendtime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required className="h-11 rounded-xl border-border/80 px-3" />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Bookings remain available before {startTime} and from {endTime} onward.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="hreason">Reason <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="hreason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Sinhala & Tamil New Year" maxLength={120} className="h-12 rounded-xl border-border/80 px-4" />
              <div className="flex flex-wrap gap-2 pt-1">
                {REASON_PRESETS.map((preset) => (
                  <button key={preset} type="button" onClick={() => setReason(preset)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={saving || !date} className="mt-6 h-12 w-full rounded-xl font-bold shadow-md shadow-primary/15">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {saving ? "Scheduling closure…" : "Add closure"}
          </Button>
        </form>

        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-6 py-5">
            <div><h2 className="font-heading text-xl font-bold text-foreground">Closing date calendar</h2><p className="mt-1 text-xs text-muted-foreground">Manage every date currently blocked from booking.</p></div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{holidays.length} total</span>
          </div>
          {sortedHolidays.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
              <span className="grid size-16 place-items-center rounded-3xl bg-muted text-muted-foreground/50"><CalendarCheck className="size-8" /></span>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">No closing dates scheduled</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Your restaurant follows its normal availability every day. Add a date when you need to pause bookings.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {sortedHolidays.map((holiday) => {
                const dateStr = holiday.date.slice(0, 10);
                const isPast = (holiday.endDate ?? holiday.date).slice(0, 10) < today;
                const isRemoving = removingDate === dateStr;
                return (
                  <div key={holiday.id} className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/20">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        <span className="text-center leading-none">
                          <span className="block text-[0.62rem] font-bold uppercase tracking-wider">{formatDate(dateStr, { month: "short" })}</span>
                          <span className="mt-1 block text-lg font-extrabold">{formatDate(dateStr, { day: "numeric" })}</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground">{formatDateRange(dateStr, holiday.endDate)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{isPast ? "Past" : "Upcoming"}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="truncate">{holiday.reason || "No reason provided"}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                            <Clock3 className="size-3.5 text-primary" />
                            {holiday.allDay ? "All day" : `${holiday.startTime}–${holiday.endTime}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => void remove(dateStr)} disabled={isRemoving} title="Remove closure and reopen bookings">
                      {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-start gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 text-xs leading-relaxed text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" />
            Existing reservations are not automatically cancelled when you add a closing date. Review that date in Reservations if needed.
          </div>
        </section>
      </div>
    </div>
  );
}
