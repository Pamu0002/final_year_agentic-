// UI-only redesign: Restyled payment status button with smooth hover states and loading indicator
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface PaymentStatusButtonProps {
  paymentId: string;
  currentStatus: string;
}

export function PaymentStatusButton({ paymentId, currentStatus }: PaymentStatusButtonProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canMarkPaid = status === "PENDING";

  async function handleMarkPaid() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/restaurant-portal/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUCCEEDED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Failed to update status");
      }
      setStatus("SUCCEEDED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!canMarkPaid) {
    return null;
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-xl border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
        onClick={handleMarkPaid}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin mr-1.5" />
        ) : (
          <CheckCircle2 className="size-3.5 mr-1.5" />
        )}
        Mark as Paid
      </Button>
      {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}
