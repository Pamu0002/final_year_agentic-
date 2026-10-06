"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Users, MapPin, ExternalLink, CreditCard, UtensilsCrossed } from "lucide-react";

interface OrderItem { name: string; price: number; quantity: number; category?: string }

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl: string | null;
  refundedAt?: string | null;
  orderItems: OrderItem[] | null;
  createdAt: string;
  reservation: {
    id: string;
    date: string;
    time: string;
    partySize: number;
    status: string;
    restaurant: { name: string; address: string; area: string };
  };
}

const STATUS_STYLES: Record<string, string> = {
  SUCCEEDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export function PaymentHistoryList({ initial }: { initial: PaymentRecord[] }) {
  const [payments, setPayments] = useState(initial);
  const [loading, setLoading] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/proxy/payments/history", { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load payments (${response.status})`);
      setPayments(await response.json() as PaymentRecord[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments");
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><CreditCard className="h-7 w-7 text-muted-foreground" /></div>
        <p className="font-medium">{loading ? "Loading payments…" : "No payments yet"}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{error ?? "Your payment history will appear here after you book a table and complete a payment."}</p>
        {error && <button className="text-sm font-medium text-primary hover:underline" onClick={() => void refresh()}>Try again</button>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Payment refresh failed. <button className="font-medium underline" onClick={() => void refresh()}>Try again</button></div>}
      {payments.map((p) => {
        const dateLabel = new Date(p.reservation.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
        const activityDate = p.status === "REFUNDED" && p.refundedAt ? p.refundedAt : p.createdAt;
        const createdLabel = new Date(activityDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        return (
          <Card key={p.id}><CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold text-sm truncate">{p.reservation.restaurant.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3 shrink-0" />{p.reservation.restaurant.area}</p><p className="mt-1 text-[11px] font-medium text-muted-foreground">Reservation: {p.reservation.status.replaceAll("_", " ")}</p></div>
              <div className="flex items-center gap-2 shrink-0"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? "bg-muted text-foreground"}`}>{p.status}</span><span className="text-sm font-semibold">{p.currency} {p.amount.toLocaleString()}</span></div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{dateLabel}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.reservation.time}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p.reservation.partySize} {p.reservation.partySize === 1 ? "person" : "people"}</span>
            </div>
            {p.orderItems && p.orderItems.length > 0 && <div className="rounded-md bg-muted/40 border px-3 py-2 space-y-1.5"><p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" />Pre-ordered items</p>{p.orderItems.map((item, i) => <div key={i} className="flex justify-between text-xs"><span>{item.quantity}× {item.name}</span><span className="text-muted-foreground">{p.currency} {(item.price * item.quantity).toLocaleString()}</span></div>)}</div>}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5"><span>{p.status === "REFUNDED" ? "Refunded" : p.status === "SUCCEEDED" ? "Paid" : "Created"} on {createdLabel}</span>{p.receiptUrl && <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"><a href={p.receiptUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />Receipt</a></Button>}</div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}
