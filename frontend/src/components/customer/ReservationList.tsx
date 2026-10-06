"use client";

import { useCallback, useEffect, useState } from "react";
import { ReservationCard, type Reservation, type ReviewData } from "./ReservationCard";
import { CalendarX } from "lucide-react";

export function ReservationList({ initial }: { initial: Reservation[] }) {
  const [reservations, setReservations] = useState(initial);
  const [loading, setLoading] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/proxy/reservations", { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load reservations (${response.status})`);
      setReservations(await response.json() as Reservation[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  function handleCancel(updated: Reservation) {
    setReservations(prev =>
      prev.map(r => r.id === updated.id ? updated : r)
    );
  }

  function handleReviewSaved(id: string, review: ReviewData) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, review } : r)
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
        <CalendarX className="h-10 w-10" />
        <p className="font-medium">{loading ? "Loading reservations…" : "No reservations yet"}</p>
        <p className="text-sm">{error ?? "Head to the Chat tab to discover and book restaurants."}</p>
        {error && (
          <button className="text-sm font-medium text-primary hover:underline" onClick={() => void refresh()}>
            Try again
          </button>
        )}
      </div>
    );
  }

  const upcoming = reservations.filter(r => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status));
  const past = reservations.filter(r => !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Status refresh failed. <button className="font-medium underline" onClick={() => void refresh()}>Try again</button>
        </div>
      )}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
          {upcoming.map(r => (
            <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} onReviewSaved={handleReviewSaved} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past</h2>
          {past.map(r => (
            <ReservationCard key={r.id} reservation={r} onReviewSaved={handleReviewSaved} />
          ))}
        </section>
      )}
    </div>
  );
}
