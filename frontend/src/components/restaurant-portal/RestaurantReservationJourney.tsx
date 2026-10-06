import {
  CalendarCheck,
  Check,
  CreditCard,
  LogIn,
  Star,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepState = "complete" | "current" | "upcoming" | "stopped";

interface JourneyReservation {
  status: string;
  payment: { amount: number; status: string } | null;
  review: { rating: number } | null;
}

interface JourneyStep {
  label: string;
  detail: string;
  state: StepState;
  icon: React.ElementType;
}

function getSteps(reservation: JourneyReservation): JourneyStep[] {
  const status = reservation.status;
  const payment = reservation.payment;
  const isCancelled = status === "CANCELLED";
  const isNoShow = status === "NO_SHOW";
  const isConfirmed = ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"].includes(status);
  const isCheckedIn = ["CHECKED_IN", "COMPLETED"].includes(status);
  const isCompleted = status === "COMPLETED";
  const isPaid = payment?.status === "SUCCEEDED";
  const isRefunded = payment?.status === "REFUNDED";

  return [
    {
      label: "Reserved",
      detail: "Booking received",
      state: "complete",
      icon: CalendarCheck,
    },
    {
      label: "Payment",
      detail: isPaid
        ? `LKR ${payment.amount.toLocaleString()} paid`
        : isRefunded
          ? "Payment refunded"
          : payment?.status === "FAILED"
            ? "Payment failed"
            : "Waiting for payment",
      state: isPaid ? "complete" : isCancelled || isRefunded ? "stopped" : "current",
      icon: CreditCard,
    },
    {
      label: "Confirm",
      detail: isConfirmed
        ? "Restaurant confirmed"
        : isCancelled
          ? "Booking cancelled"
          : isPaid
            ? "Ready to confirm"
            : "After payment",
      state: isConfirmed ? "complete" : isCancelled ? "stopped" : isPaid ? "current" : "upcoming",
      icon: Store,
    },
    {
      label: "Check in",
      detail: isCheckedIn
        ? "Guest arrived"
        : isNoShow
          ? "Guest did not arrive"
          : isCancelled
            ? "Booking cancelled"
            : status === "CONFIRMED"
              ? "Awaiting guest arrival"
              : "After confirmation",
      state: isCheckedIn ? "complete" : isNoShow || isCancelled ? "stopped" : status === "CONFIRMED" ? "current" : "upcoming",
      icon: LogIn,
    },
    {
      label: "Complete",
      detail: isCompleted
        ? "Dining completed"
        : isNoShow
          ? "Marked no-show"
          : isCancelled
            ? "Process stopped"
            : status === "CHECKED_IN"
              ? "Ready to complete"
              : "After check-in",
      state: isCompleted ? "complete" : isNoShow || isCancelled ? "stopped" : status === "CHECKED_IN" ? "current" : "upcoming",
      icon: Check,
    },
    {
      label: "Review",
      detail: reservation.review
        ? `${reservation.review.rating}/5 received`
        : isNoShow || isCancelled
          ? "Not available"
          : isCompleted
            ? "Waiting for guest review"
            : "After dining",
      state: reservation.review ? "complete" : isNoShow || isCancelled ? "stopped" : isCompleted ? "current" : "upcoming",
      icon: Star,
    },
  ];
}

const DOT_STYLE: Record<StepState, string> = {
  complete: "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25",
  current: "border-accent bg-accent text-accent-foreground ring-4 ring-accent/15",
  upcoming: "border-border bg-card text-muted-foreground",
  stopped: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function RestaurantReservationJourney({ reservation }: { reservation: JourneyReservation }) {
  const steps = getSteps(reservation);

  return (
    <div className="grid min-w-[720px] grid-cols-6 gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      {steps.map((step, index) => {
        const StepIcon = step.state === "complete" ? Check : step.state === "stopped" ? X : step.icon;
        const nextComplete = steps[index + 1]?.state === "complete";

        return (
          <div key={step.label} className="relative text-center">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-[calc(50%+17px)] top-4 h-px w-[calc(100%-34px)] bg-border",
                  step.state === "complete" && nextComplete && "bg-primary",
                )}
              />
            )}
            <span className={cn("relative z-10 mx-auto grid size-8 place-items-center rounded-full border-2", DOT_STYLE[step.state])}>
              <StepIcon className="size-3.5" />
            </span>
            <p className={cn("mt-1.5 text-[0.68rem] font-bold", step.state === "upcoming" && "text-muted-foreground")}>
              {step.label}
            </p>
            <p className="mt-0.5 text-[0.62rem] leading-3.5 text-muted-foreground">{step.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
