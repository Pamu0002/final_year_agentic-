"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  RefreshCw,
  Sparkles,
  Star,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationJourney } from "./ReservationJourney";
import type { Reservation } from "./ReservationCard";

const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "CHECKED_IN"]);

function bookingTimestamp(reservation: Reservation) {
  return new Date(`${reservation.date.slice(0, 10)}T${reservation.time}:00+05:30`).getTime();
}

function chooseImportantReservation(reservations: Reservation[]) {
  const active = reservations
    .filter((reservation) => ACTIVE_STATUSES.has(reservation.status))
    .sort((a, b) => bookingTimestamp(a) - bookingTimestamp(b));

  if (active.length > 0) return active[0];

  return reservations
    .filter((reservation) => reservation.status === "COMPLETED" && !reservation.review)
    .sort((a, b) => bookingTimestamp(b) - bookingTimestamp(a))[0] ?? null;
}

function getNextAction(reservation: Reservation) {
  const paid = reservation.payment?.status === "SUCCEEDED";
  if (!paid && ACTIVE_STATUSES.has(reservation.status)) {
    return {
      icon: CreditCard,
      eyebrow: "Action required",
      title: "Complete your deposit",
      detail: "Pay the reservation deposit so the restaurant can confirm your table.",
      button: "Pay now",
    };
  }
  if (reservation.status === "PENDING") {
    const deadline = reservation.confirmationExpiresAt
      ? new Date(reservation.confirmationExpiresAt).toLocaleTimeString("en-LK", {
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo",
        })
      : null;
    return {
      icon: Store,
      eyebrow: "Restaurant response",
      title: "Waiting for confirmation",
      detail: deadline
        ? `Your payment is complete. The restaurant must respond by ${deadline}, or you’ll receive an automatic refund.`
        : "Your payment is complete. The restaurant will confirm your table shortly.",
      button: "View booking",
    };
  }
  if (reservation.status === "CONFIRMED") {
    return {
      icon: CheckCircle2,
      eyebrow: "You’re all set",
      title: "Your table is confirmed",
      detail: "Everything is ready. Review your dining details before you arrive.",
      button: "View details",
    };
  }
  if (reservation.status === "CHECKED_IN") {
    return {
      icon: UtensilsCrossed,
      eyebrow: "Dining now",
      title: "Enjoy your experience",
      detail: "You’re checked in. Your booking will be completed after your visit.",
      button: "View booking",
    };
  }
  return {
    icon: Star,
    eyebrow: "One last step",
    title: "How was your experience?",
    detail: "Your visit is complete. Share a review to help other diners.",
    button: "Leave a review",
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
};

export function HomeBookingProgress({ initialReservations }: { initialReservations: Reservation[] }) {
  const [reservations, setReservations] = useState(initialReservations);
  const [refreshing, setRefreshing] = useState(false);
  const featured = useMemo(() => chooseImportantReservation(reservations), [reservations]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/proxy/reservations", { cache: "no-store" });
      if (response.ok) setReservations(await response.json() as Reservation[]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 20_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  if (!featured) return null;

  const action = getNextAction(featured);
  const ActionIcon = action.icon;
  const dateLabel = new Date(`${featured.date.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });

  return (
    <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-10" aria-label="Your next booking">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-xl shadow-primary/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D4B57D] via-primary to-[#D4B57D]" />
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="size-3.5" /> Your next booking
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {STATUS_LABELS[featured.status] ?? featured.status.replaceAll("_", " ")}
                  </span>
                </div>
                <Link href={`/restaurants/${featured.restaurantId}`} className="mt-2 inline-flex items-center gap-2 font-heading text-2xl font-semibold hover:text-primary sm:text-3xl">
                  {featured.restaurant.name}
                  <ArrowRight className="size-5" />
                </Link>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {featured.restaurant.area}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                title="Refresh booking status"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Live status
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/65 p-3">
                <CalendarDays className="size-4 shrink-0 text-primary" />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</p><p className="mt-0.5 text-sm font-semibold">{dateLabel}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/65 p-3">
                <Clock3 className="size-4 shrink-0 text-primary" />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time</p><p className="mt-0.5 text-sm font-semibold">{featured.time}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/65 p-3">
                <Users className="size-4 shrink-0 text-primary" />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Party</p><p className="mt-0.5 text-sm font-semibold">{featured.partySize} {featured.partySize === 1 ? "guest" : "guests"}</p></div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl bg-[#47131F] p-5 text-white shadow-lg">
            <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#E7C98F] ring-1 ring-white/15">
              <ActionIcon className="size-5" />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E7C98F]">{action.eyebrow}</p>
            <h3 className="mt-1 text-lg font-bold">{action.title}</h3>
            <p className="mt-2 text-sm leading-5 text-white/65">{action.detail}</p>
            <Button asChild className="mt-4 w-full bg-white text-[#47131F] hover:bg-white/90">
              <Link href="/reservations">{action.button} <ArrowRight className="size-4" /></Link>
            </Button>
          </aside>
        </div>

        <div className="relative border-t border-border/70 bg-muted/20 p-4 sm:px-7 sm:py-5">
          <ReservationJourney reservation={featured} />
        </div>
      </div>
    </section>
  );
}
