"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Users, MapPin, X, Star, Pencil, ChevronRight, CreditCard, Loader2, Receipt } from "lucide-react";
import { ReviewModal } from "./ReviewModal";
import { ReservationDetailDrawer } from "./ReservationDetailDrawer";
import { ReservationJourney } from "./ReservationJourney";

const STATUS_COLOURS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  imageUrls: string;
  createdAt: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  receiptUrl: string | null;
  refundId?: string | null;
  refundedAt?: string | null;
  orderItems: OrderItem[] | null;
  createdAt: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurant: { name: string; address: string; area: string };
  date: string;
  time: string;
  partySize: number;
  specialRequests: string | null;
  status: string;
  confirmationExpiresAt?: string | null;
  createdAt: string;
  payment: Payment | null;
  review: ReviewData | null;
}

interface ReservationCardProps {
  reservation: Reservation;
  onCancel?: (reservation: Reservation) => void;
  onReviewSaved?: (id: string, review: ReviewData) => void;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function ReservationCard({ reservation, onCancel, onReviewSaved }: ReservationCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(reservation.review);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const canCancel = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canReview = reservation.status === "COMPLETED";
  const isActive = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const needsPayment = isActive && reservation.payment?.status !== "SUCCEEDED";
  const dateLabel = new Date(reservation.date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onCancel) return;
    const confirmed = window.confirm(
      "Cancel this reservation? If your payment is eligible, the full refund will be submitted to Stripe automatically.",
    );
    if (!confirmed) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch(`/api/proxy/reservations/${reservation.id}`, { method: "DELETE" });
      const result = await response.json() as {
        reservation?: Reservation;
        refund?: { status: string; amount: number; requiredHours?: number };
        error?: string;
      };
      if (!response.ok || !result.reservation) {
        throw new Error(result.error ?? "Cancellation failed");
      }
      onCancel(result.reservation);
      if (result.refund?.status === "REFUNDED") {
        window.alert(`Reservation cancelled. A refund of LKR ${result.refund.amount.toLocaleString()} was submitted to Stripe.`);
      } else if (result.refund?.status === "NOT_ELIGIBLE") {
        window.alert(`Reservation cancelled. This booking was inside the ${result.refund.requiredHours}-hour non-refundable period.`);
      }
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  function handleReviewSaved(saved: ReviewData) {
    setReview(saved);
    setShowReview(false);
    onReviewSaved?.(reservation.id, saved);
  }

  async function handlePayment(e: React.MouseEvent) {
    e.stopPropagation();
    setPaying(true);
    setPaymentError(null);
    try {
      const response = await fetch("/api/proxy/payments/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          orderItems: reservation.payment?.orderItems ?? [],
        }),
      });
      const result = await response.json() as { paymentUrl?: string; error?: string };
      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.error ?? "Unable to start payment");
      }
      window.location.assign(result.paymentUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to start payment");
      setPaying(false);
    }
  }

  const reservationWithReview = { ...reservation, review };

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowDetail(true)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{reservation.restaurant.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {reservation.restaurant.area}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOURS[reservation.status] ?? "bg-muted"}`}>
                {reservation.status}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {dateLabel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {reservation.time}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {reservation.partySize} {reservation.partySize === 1 ? "person" : "people"}
            </span>
          </div>

          <ReservationJourney reservation={reservationWithReview} />

          {/* Pre-order summary */}
          {reservation.payment?.orderItems && reservation.payment.orderItems.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {reservation.payment.orderItems.length} item{reservation.payment.orderItems.length !== 1 ? "s" : ""} pre-ordered
              </span>
              <span className="font-medium text-foreground">
                LKR {reservation.payment.amount.toLocaleString()}
              </span>
            </div>
          )}

          {/* Existing review summary */}
          {review && (
            <div className="rounded-md bg-muted/30 border border-border px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <StarDisplay rating={review.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>
              {review.comment && (
                <p className="text-xs text-muted-foreground line-clamp-1">{review.comment}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {needsPayment && (
              <Button size="sm" onClick={handlePayment} disabled={paying}>
                {paying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                {paying ? "Opening checkout…" : reservation.payment?.status === "FAILED" ? "Retry payment" : "Continue payment"}
              </Button>
            )}
            {reservation.payment?.receiptUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={reservation.payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <Receipt className="h-3.5 w-3.5" /> Receipt
                </a>
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30"
                onClick={handleCancel}
                disabled={cancelling}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {cancelling ? "Cancelling…" : "Cancel reservation"}
              </Button>
            )}
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setShowReview(true); }}
              >
                {review ? (
                  <><Pencil className="h-3.5 w-3.5 mr-1" />Edit Review</>
                ) : (
                  <><Star className="h-3.5 w-3.5 mr-1" />Write Review</>
                )}
              </Button>
            )}
          </div>
          {cancelError && <p className="text-xs text-destructive">{cancelError}</p>}
          {paymentError && <p className="text-xs text-destructive">{paymentError}</p>}
        </CardContent>
      </Card>

      {showDetail && (
        <ReservationDetailDrawer
          reservation={reservationWithReview}
          onClose={() => setShowDetail(false)}
        />
      )}

      {showReview && (
        <ReviewModal
          reservationId={reservation.id}
          restaurantName={reservation.restaurant.name}
          existingReview={review}
          onClose={() => setShowReview(false)}
          onSaved={handleReviewSaved}
        />
      )}
    </>
  );
}
