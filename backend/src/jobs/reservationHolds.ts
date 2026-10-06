import cron from "node-cron";
import { prisma } from "../../lib/db.js";
import { createNotification } from "../../lib/notifications.js";
import { refundReservationPayment } from "../modules/payment/refund.service.js";

const cancelUnpaidHolds = async (now: Date): Promise<number> => {
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      holdExpiresAt: { lte: now },
      OR: [
        { payment: { is: null } },
        { payment: { is: { status: { not: "SUCCEEDED" } } } },
      ],
    },
    select: { id: true },
  });
  if (!expired.length) return 0;

  const reservationIds = expired.map((reservation) => reservation.id);
  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { reservationId: { in: reservationIds }, status: "PENDING" },
      data: { status: "FAILED" },
    }),
    prisma.reservation.updateMany({
      where: { id: { in: reservationIds }, status: "PENDING" },
      data: {
        status: "CANCELLED",
        holdExpiresAt: null,
        confirmationExpiresAt: null,
        cancelledAt: now,
        cancelledBy: "SYSTEM",
        cancellationReason: "PAYMENT_HOLD_EXPIRED",
      },
    }),
  ]);
  return reservationIds.length;
};

const refundTimedOutConfirmation = async (reservationId: string) => {
  try {
    return await refundReservationPayment(reservationId, "RESTAURANT_CONFIRMATION_TIMEOUT");
  } catch (error) {
    console.error(`[reservation-confirmation] refund failed for ${reservationId}; retrying next cycle`, error);
    return null;
  }
};

const cancelUnconfirmedPaidBookings = async (now: Date): Promise<number> => {
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      confirmationExpiresAt: { lte: now },
      payment: { is: { status: "SUCCEEDED" } },
    },
    include: {
      payment: { select: { amount: true } },
      restaurant: { select: { id: true, name: true, adminId: true } },
    },
  });

  let cancelled = 0;
  for (const reservation of expired) {
    const claimed = await prisma.reservation.updateMany({
      where: { id: reservation.id, status: "PENDING", confirmationExpiresAt: { lte: now } },
      data: {
        status: "CANCELLED",
        confirmationExpiresAt: null,
        holdExpiresAt: null,
        cancelledAt: now,
        cancelledBy: "SYSTEM",
        cancellationReason: "RESTAURANT_CONFIRMATION_TIMEOUT",
      },
    });
    if (!claimed.count) continue;
    cancelled += 1;

    const refund = await refundTimedOutConfirmation(reservation.id);
    const refundCompleted = refund?.status === "REFUNDED" || refund?.status === "ALREADY_REFUNDED";
    createNotification(
      reservation.userId,
      "RESERVATION_CANCELLED",
      "Restaurant did not confirm in time",
      refundCompleted
        ? `${reservation.restaurant.name} did not respond before the deadline. Your booking was cancelled and LKR ${refund.amount.toLocaleString()} was refunded.`
        : `${reservation.restaurant.name} did not respond before the deadline. Your booking was cancelled and your refund is being processed.`,
      { reservationId: reservation.id, restaurantId: reservation.restaurant.id, refundStatus: refund?.status ?? "PROCESSING" },
    ).catch(() => {});
    createNotification(
      reservation.restaurant.adminId,
      "RESERVATION_CANCELLED",
      "Booking expired without confirmation",
      "A paid booking was automatically cancelled and refunded because it was not confirmed before the deadline.",
      { reservationId: reservation.id, restaurantId: reservation.restaurant.id },
    ).catch(() => {});
  }
  return cancelled;
};

const retryTimeoutRefunds = async (): Promise<void> => {
  const pendingRefunds = await prisma.reservation.findMany({
    where: {
      status: "CANCELLED",
      cancellationReason: "RESTAURANT_CONFIRMATION_TIMEOUT",
      payment: { is: { status: "SUCCEEDED" } },
    },
    select: { id: true },
    take: 20,
  });
  for (const reservation of pendingRefunds) {
    await refundTimedOutConfirmation(reservation.id);
  }
};

export const expireReservationHolds = async (): Promise<number> => {
  const now = new Date();
  const [unpaid, unconfirmed] = await Promise.all([
    cancelUnpaidHolds(now),
    cancelUnconfirmedPaidBookings(now),
  ]);
  await retryTimeoutRefunds();
  return unpaid + unconfirmed;
};

export const scheduleReservationHoldExpiry = (): void => {
  cron.schedule("* * * * *", () => {
    expireReservationHolds()
      .then((count) => {
        if (count) console.log(`[reservation-expiry] cancelled ${count} expired reservation(s)`);
      })
      .catch((error) => console.error("Reservation expiry failed:", error));
  });
};
