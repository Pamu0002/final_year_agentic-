// UI-only redesign: Restyled status select dropdown with vibrant badges and loading state
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, Check, X } from "lucide-react";
import { refreshAuthToken } from "@/lib/client/auth-token";

type Status = "PENDING" | "MODIFIED" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const NEXT_STATUSES: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  MODIFIED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const STATUS_CONFIG: Record<Status, { label: string; dot: string; pill: string; text: string }> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/40 dark:border-amber-800/60",
    text: "text-amber-700 dark:text-amber-300 font-bold",
  },
  MODIFIED: {
    label: "Modified — confirm again",
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/40 dark:border-amber-800/60",
    text: "text-amber-700 dark:text-amber-300 font-bold",
  },
  CONFIRMED: {
    label: "Confirmed",
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/40 dark:border-emerald-800/60",
    text: "text-emerald-700 dark:text-emerald-300 font-bold",
  },
  CHECKED_IN: {
    label: "Checked In",
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 border-sky-500/30 dark:bg-sky-950/40 dark:border-sky-800/60",
    text: "text-sky-700 dark:text-sky-300 font-bold",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-slate-400",
    pill: "bg-slate-500/10 border-slate-500/30 dark:bg-slate-800/60 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300 font-bold",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/40 dark:border-rose-800/60",
    text: "text-rose-700 dark:text-rose-300 font-bold",
  },
  NO_SHOW: {
    label: "No Show",
    dot: "bg-orange-500",
    pill: "bg-orange-500/10 border-orange-500/30 dark:bg-orange-950/40 dark:border-orange-800/60",
    text: "text-orange-700 dark:text-orange-300 font-bold",
  },
};

function getConfig(s: string) {
  return STATUS_CONFIG[s as Status] ?? {
    label: s,
    dot: "bg-muted-foreground",
    pill: "bg-muted border-border",
    text: "text-foreground font-semibold",
  };
}

export function ReservationStatusSelect({
  reservationId,
  currentStatus,
  paymentStatus,
  confirmationExpiresAt,
}: {
  reservationId: string;
  currentStatus: string;
  paymentStatus?: string | null;
  confirmationExpiresAt?: string | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const cfg = getConfig(status);
  const statusKey = status as Status;
  const allowedStatuses = (NEXT_STATUSES[statusKey] ?? []).filter(
    (next) => next !== "CONFIRMED" || paymentStatus === "SUCCEEDED",
  );

  const updateStatus = async (next: string) => {
    if (next === "CANCELLED" && !window.confirm(
      "Cancel this reservation? Any successful payment will be fully refunded through Stripe.",
    )) return;
    setLoading(true);
    setError(null);
    try {
      const token = await refreshAuthToken(true);
      if (!token) throw new Error("Your session has ended. Please sign in again.");
      const response = await fetch(`/api/proxy/restaurant-portal/reservations/${reservationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: next }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Status update failed");
      setStatus(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void updateStatus(e.target.value);
  };

  if (status === "PENDING" && paymentStatus === "SUCCEEDED") {
    const deadline = confirmationExpiresAt
      ? new Date(confirmationExpiresAt).toLocaleTimeString("en-LK", {
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo",
        })
      : null;
    return (
      <div className="min-w-44 space-y-2">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Response required</p>
          {deadline && <p className="mt-0.5 text-[10px] text-muted-foreground">Respond by {deadline}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => void updateStatus("CONFIRMED")}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Confirm
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void updateStatus("CANCELLED")}
            className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <X className="size-3" /> Decline &amp; refund
          </button>
        </div>
        {error && <p className="text-[11px] leading-tight text-destructive font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
        {allowedStatuses.length > 0 ? "Next action" : "Final status"}
      </span>
      <div className="relative inline-flex items-center group">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold leading-none transition-all shadow-2xs group-hover:scale-105 ${cfg.pill} ${cfg.text} ${loading ? "opacity-60" : ""}`}
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <span className={`size-2 shrink-0 rounded-full ${cfg.dot}`} />
          )}
          {cfg.label}
          <ChevronDown className="size-3 opacity-70 transition-transform group-hover:translate-y-0.5" />
        </span>
        {/* Invisible native select overlaid for accessibility + click target */}
        <select
          value={status}
          onChange={handleChange}
          disabled={loading || allowedStatuses.length === 0}
          aria-label="Change reservation status"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        >
          <option value={status}>{cfg.label}</option>
          {allowedStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="max-w-48 text-[11px] leading-tight text-destructive font-medium">{error}</span>}
    </div>
  );
}
