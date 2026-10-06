import {
  CalendarCheck,
  Check,
  CreditCard,
  Star,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation } from "./ReservationCard";

type StepState = "complete" | "current" | "upcoming" | "stopped";

interface JourneyStep {
  label: string;
  detail: string;
  state: StepState;
  icon: React.ElementType;
}

function paymentDetail(reservation: Reservation) {
  const payment = reservation.payment;
  if (!payment) return "Deposit required";
  if (payment.status === "SUCCEEDED") {
    return `${payment.currency} ${payment.amount.toLocaleString()} paid`;
  }
  if (payment.status === "REFUNDED") return "Payment refunded";
  if (payment.status === "FAILED") return "Payment failed — retry";
  return "Payment not completed";
}

function getSteps(reservation: Reservation): JourneyStep[] {
  const isCancelled = reservation.status === "CANCELLED";
  const isNoShow = reservation.status === "NO_SHOW";
  const isCompleted = reservation.status === "COMPLETED";
  const isConfirmed = ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"].includes(reservation.status);
  const isPaid = reservation.payment?.status === "SUCCEEDED";
  const isRefunded = reservation.payment?.status === "REFUNDED";

  const paymentState: StepState = isPaid
    ? "complete"
    : isRefunded || isCancelled
      ? "stopped"
      : "current";

  const confirmationState: StepState = isConfirmed
    ? "complete"
    : isCancelled
      ? "stopped"
      : isPaid
        ? "current"
        : "upcoming";

  const diningState: StepState = isCompleted
    ? "complete"
    : isNoShow || isCancelled
      ? "stopped"
    : reservation.status === "CONFIRMED" || reservation.status === "CHECKED_IN"
        ? "current"
        : "upcoming";

  const reviewState: StepState = reservation.review
    ? "complete"
    : isNoShow || isCancelled
      ? "stopped"
      : isCompleted
        ? "current"
        : "upcoming";

  return [
    {
      label: "Reserved",
      detail: "Booking details saved",
      state: "complete",
      icon: CalendarCheck,
    },
    {
      label: "Payment",
      detail: paymentDetail(reservation),
      state: paymentState,
      icon: CreditCard,
    },
    {
      label: "Confirmation",
      detail: isConfirmed
        ? "Restaurant confirmed"
        : isCancelled
          ? "Booking cancelled"
          : isPaid
            ? reservation.confirmationExpiresAt
              ? `Reply by ${new Date(reservation.confirmationExpiresAt).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" })}`
              : "Waiting for restaurant"
            : "Available after payment",
      state: confirmationState,
      icon: Store,
    },
    {
      label: "Dining",
      detail: isCompleted
        ? "Visit completed"
        : isNoShow
          ? "Marked as no-show"
          : isCancelled
            ? "Booking cancelled"
            : reservation.status === "CHECKED_IN"
              ? "Dining in progress"
              : reservation.status === "CONFIRMED"
                ? "Your table is ready"
                : "Available after confirmation",
      state: diningState,
      icon: UtensilsCrossed,
    },
    {
      label: "Review",
      detail: reservation.review
        ? `${reservation.review.rating}/5 review submitted`
        : isNoShow || isCancelled
          ? "Not available"
          : isCompleted
            ? "Share your experience"
            : "Available after dining",
      state: reviewState,
      icon: Star,
    },
  ];
}

const STATE_STYLES: Record<StepState, string> = {
  complete: "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25",
  current: "border-accent bg-accent text-accent-foreground ring-4 ring-accent/15",
  upcoming: "border-border bg-background text-muted-foreground",
  stopped: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function ReservationJourney({ reservation }: { reservation: Reservation }) {
  const steps = getSteps(reservation);

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-5 sm:gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const StateIcon = step.state === "complete" ? Check : step.state === "stopped" ? X : Icon;
          const nextComplete = steps[index + 1]?.state === "complete";

          return (
            <div key={step.label} className="relative flex gap-3 sm:block sm:text-center">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[17px] top-9 h-[calc(100%+0.25rem)] w-px bg-border sm:left-[calc(50%+18px)] sm:top-[17px] sm:h-px sm:w-[calc(100%-36px)]",
                    (step.state === "complete" && nextComplete) && "bg-primary",
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors sm:mx-auto",
                  STATE_STYLES[step.state],
                )}
              >
                <StateIcon className="size-4" />
              </div>
              <div className="min-w-0 pt-0.5 sm:pt-2">
                <p className={cn("text-xs font-bold", step.state === "upcoming" && "text-muted-foreground")}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
