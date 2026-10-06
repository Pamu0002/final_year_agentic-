"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [verification, setVerification] = useState<"checking" | "verified" | "failed">(
    sessionId ? "checking" : "failed",
  );

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    void fetch("/api/proxy/payments/confirm-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Payment verification failed");
        setVerification("verified");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setVerification("failed");
      });
    return () => controller.abort();
  }, [sessionId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {verification === "checking" ? "Verifying payment…" : "Payment successful"}
        </h1>
        <p className="text-muted-foreground">
          {verification === "failed"
            ? "Stripe accepted your return, but verification is still pending. Check Payments shortly or contact support if it does not update."
            : verification === "checking"
              ? "Please wait while we securely confirm your payment with Stripe."
              : "Your deposit was paid successfully. The restaurant has been notified and must now confirm your table. If it does not respond before the deadline, your payment will be refunded automatically."}
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground/60 font-mono">{sessionId}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/reservations">View My Reservations</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/chat">Back to Chat</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
