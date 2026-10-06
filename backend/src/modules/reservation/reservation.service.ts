import { prisma } from "../../../lib/db.js";
import { adminFirestore } from "../../config/firebase.js";
import { sendEmail } from "../../config/nodemailer.js";
import { createNotification } from "../../../lib/notifications.js";
import { CANCELLATION_REFUND_HOURS, RESERVATION_HOLD_MINUTES, RESTAURANT_CONFIRMATION_MINUTES } from "../../config/payments.js";
import { refundReservationPayment, type RefundOutcome } from "../payment/refund.service.js";
import { getCancellationEligibility } from "./cancellation-policy.js";
import { ACTIVE_CAPACITY_STATUSES, getMatchingClosure, getOpeningTimeSlots } from "./availability.js";
import type { z } from "zod";
import type {
  CreateReservationBodySchema,
  UpdateReservationBodySchema,
} from "./reservation.schema.js";

export type CreateReservationInput = z.infer<typeof CreateReservationBodySchema>;
export type UpdateReservationInput = z.infer<typeof UpdateReservationBodySchema>;

export const getUserReservations = async (userId: string) => {
  return prisma.reservation.findMany({
    where: { userId },
    include: {
      restaurant: true,
      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          receiptUrl: true,
          refundId: true,
          refundedAt: true,
          orderItems: true,
          createdAt: true,
        },
      },
      review: { select: { id: true, rating: true, comment: true, imageUrls: true, createdAt: true } },
    },
    orderBy: { date: "desc" },
  });
};

export const getReservationById = async (id: string, userId: string) => {
  return prisma.reservation.findUnique({
    where: { id, userId },
    include: { restaurant: true, payment: true },
  });
};

export const createReservation = async (
  input: CreateReservationInput,
  userId: string,
  _userEmail: string,
) => {
  const reservationDate = new Date(input.date);
  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60_000);

  try {
    return await prisma.$transaction(async (tx) => {
      // One transaction at a time may allocate seats for a restaurant/date/time.
      const lockKey = `${input.restaurantId}:${input.date}:${input.time}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      await tx.reservation.updateMany({
        where: { status: "PENDING", holdExpiresAt: { lte: now } },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledBy: "SYSTEM",
          cancellationReason: "PAYMENT_HOLD_EXPIRED",
          confirmationExpiresAt: null,
        },
      });

      const restaurant = await tx.restaurant.findUnique({
        where: { id: input.restaurantId },
        include: { tables: { where: { isActive: true }, select: { capacity: true } } },
      });
      if (!restaurant || !restaurant.isActive) {
        throw Object.assign(new Error("Restaurant not found or inactive"), { status: 404 });
      }

      const openingSlots = getOpeningTimeSlots(restaurant.openingHours, input.date);
      if (!openingSlots.includes(input.time)) {
        throw Object.assign(new Error("The restaurant is closed at this time"), { status: 409 });
      }

      const [closures, override, duplicate, bookedSeatsAgg] = await Promise.all([
        tx.restaurantHoliday.findMany({
          where: {
            restaurantId: input.restaurantId,
            date: { lte: reservationDate },
            OR: [
              { endDate: null, date: reservationDate },
              { endDate: { gte: reservationDate } },
            ],
          },
        }),
        tx.restaurantSlotOverride.findUnique({
          where: {
            restaurantId_date_time: {
              restaurantId: input.restaurantId,
              date: reservationDate,
              time: input.time,
            },
          },
        }),
        tx.reservation.findFirst({
          where: {
            userId,
            restaurantId: input.restaurantId,
            date: reservationDate,
            time: input.time,
            OR: [
              { status: { in: [...ACTIVE_CAPACITY_STATUSES] } },
              {
                status: "PENDING",
                OR: [
                  { holdExpiresAt: { gt: now } },
                  { confirmationExpiresAt: { gt: now } },
                ],
              },
            ],
          },
        }),
        tx.reservation.aggregate({
          where: {
            restaurantId: input.restaurantId,
            date: reservationDate,
            time: input.time,
            OR: [
              { status: { in: [...ACTIVE_CAPACITY_STATUSES] } },
              {
                status: "PENDING",
                OR: [
                  { holdExpiresAt: { gt: now } },
                  { confirmationExpiresAt: { gt: now } },
                ],
              },
            ],
          },
          _sum: { partySize: true },
        }),
      ]);

      const closure = getMatchingClosure(closures, input.time);
      if (closure) {
        throw Object.assign(
          new Error(closure.reason ? `The restaurant is unavailable: ${closure.reason}` : "The restaurant is closed at this time"),
          { status: 409 },
        );
      }
      if (override?.isBlocked) throw Object.assign(new Error("This time slot is blocked by the restaurant"), { status: 409 });
      if (duplicate) {
        throw Object.assign(new Error("You already have an active reservation for this restaurant and time"), { status: 409 });
      }

      const tableCapacity = restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);
      const baseCapacity = tableCapacity || restaurant.maxCapacity;
      const slotCapacity = override?.capacity ?? baseCapacity;
      const bookedSeats = bookedSeatsAgg._sum.partySize ?? 0;
      if (input.partySize > slotCapacity || bookedSeats + input.partySize > slotCapacity) {
        throw Object.assign(new Error("This time slot does not have enough remaining seats"), { status: 409 });
      }

      return tx.reservation.create({
        data: {
          userId,
          restaurantId: input.restaurantId,
          date: reservationDate,
          time: input.time,
          partySize: input.partySize,
          specialRequests: input.specialRequests,
          status: "PENDING",
          holdExpiresAt,
        },
        include: { restaurant: true },
      });
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      throw Object.assign(new Error("You already have an active reservation for this restaurant and time"), { status: 409 });
    }
    throw error;
  }
};

/** Keep a paid reservation pending until the restaurant explicitly accepts it.
 *  confirmationExpiresAt being null makes this idempotent across Stripe retries. */
export const markPaidReservationAwaitingConfirmation = async (reservationId: string): Promise<void> => {
  const confirmationExpiresAt = new Date(Date.now() + RESTAURANT_CONFIRMATION_MINUTES * 60_000);
  const updated = await prisma.reservation.updateMany({
    where: { id: reservationId, status: "PENDING", confirmationExpiresAt: null },
    data: { holdExpiresAt: null, confirmationExpiresAt },
  });
  if (updated.count === 0) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: true, user: true },
  });
  if (!reservation) return;

  const date = reservation.date.toISOString().split("T")[0];

  // Tell the customer that payment succeeded but restaurant approval is pending.
  createNotification(
    reservation.userId,
    "PAYMENT_CONFIRMED",
    "Payment received — awaiting restaurant",
    `Your payment was successful. ${reservation.restaurant.name} has until ${confirmationExpiresAt.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" })} to confirm your table.`,
    { reservationId: reservation.id, restaurantId: reservation.restaurantId, confirmationExpiresAt: confirmationExpiresAt.toISOString() },
  ).catch(() => {});

  // Restaurant must now manually confirm or decline the paid booking.
  createNotification(
    reservation.restaurant.adminId,
    "RESERVATION_CONFIRMED",
    "Paid booking requires confirmation",
    `Confirm or decline this booking for ${reservation.partySize} guest(s) on ${date} at ${reservation.time} before the response deadline.`,
    { reservationId: reservation.id, restaurantId: reservation.restaurantId, confirmationExpiresAt: confirmationExpiresAt.toISOString(), actionRequired: true },
  ).catch(() => {});

  // Firestore sync (best-effort)
  adminFirestore
    .collection("reservations")
    .doc(reservation.id)
    .set({
      userId: reservation.userId,
      restaurantId: reservation.restaurantId,
      date,
      time: reservation.time,
      partySize: reservation.partySize,
      status: "PENDING",
      confirmationExpiresAt: confirmationExpiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .catch((err) => console.error("Firestore sync failed (non-fatal):", err));

  // Payment receipt / pending confirmation email (best-effort)
  sendEmail(
    reservation.user.email,
    "Payment received — Restaurant confirmation pending",
    `<h2>Your payment was successful</h2>
     <p><strong>Restaurant:</strong> ${reservation.restaurant.name}</p>
     <p><strong>Date:</strong> ${date}</p>
     <p><strong>Time:</strong> ${reservation.time}</p>
     <p><strong>Party size:</strong> ${reservation.partySize}</p>
     ${reservation.specialRequests ? `<p><strong>Special requests:</strong> ${reservation.specialRequests}</p>` : ""}
     <p>The restaurant must now confirm your table. If it does not respond within ${RESTAURANT_CONFIRMATION_MINUTES} minutes, the reservation will be cancelled and your payment will be refunded automatically.</p>`,
  ).catch((err) => console.error("Confirmation email failed (non-fatal):", err));
};

export const cancelReservation = async (id: string, userId: string) => {
  const existing = await prisma.reservation.findFirst({
    where: { id, userId },
    include: { restaurant: true, payment: true },
  });
  if (!existing) throw Object.assign(new Error("Reservation not found"), { status: 404 });
  if (!["PENDING", "CONFIRMED", "MODIFIED"].includes(existing.status)) {
    throw Object.assign(new Error(`A ${existing.status.toLowerCase()} reservation cannot be cancelled`), { status: 409 });
  }

  const eligibility = getCancellationEligibility(existing.date, existing.time);
  if (eligibility.hoursUntilReservation <= 0) {
    throw Object.assign(new Error("Past reservations cannot be cancelled"), { status: 409 });
  }

  let refund: RefundOutcome | { status: "NOT_ELIGIBLE"; amount: number; requiredHours: number } = {
    status: "NOT_APPLICABLE",
    amount: existing.payment?.amount ?? 0,
  };

  if (existing.payment?.status === "PENDING") {
    refund = await refundReservationPayment(id, "CUSTOMER_CANCELLATION");
  } else if (existing.payment?.status === "SUCCEEDED") {
    refund = existing.status === "PENDING" || eligibility.fullRefundEligible
      ? await refundReservationPayment(id, "CUSTOMER_CANCELLATION")
      : {
          status: "NOT_ELIGIBLE",
          amount: existing.payment.amount,
          requiredHours: CANCELLATION_REFUND_HOURS,
        };
  } else if (existing.payment?.status === "REFUNDED") {
    refund = await refundReservationPayment(id, "CUSTOMER_CANCELLATION");
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: "CUSTOMER",
      cancellationReason: "CUSTOMER_REQUEST",
      holdExpiresAt: null,
      confirmationExpiresAt: null,
    },
    include: { restaurant: true, payment: true },
  });

  // Notify customer
  createNotification(
    reservation.userId,
    "RESERVATION_CANCELLED",
    "Reservation Cancelled",
    refund.status === "REFUNDED"
      ? `Your reservation at ${reservation.restaurant.name} was cancelled. A full refund of LKR ${refund.amount.toLocaleString()} was submitted to Stripe.`
      : refund.status === "NOT_ELIGIBLE"
        ? `Your reservation at ${reservation.restaurant.name} was cancelled. It was inside the ${CANCELLATION_REFUND_HOURS}-hour non-refundable period.`
        : `Your reservation at ${reservation.restaurant.name} has been cancelled.`,
    { reservationId: id },
  ).catch(() => {});

  // Notify restaurant admin
  createNotification(
    reservation.restaurant.adminId,
    "RESERVATION_CANCELLED",
    "Reservation Cancelled",
    `A reservation for ${reservation.date.toISOString().split("T")[0]} at ${reservation.time} has been cancelled by the customer.`,
    { reservationId: id },
  ).catch(() => {});

  adminFirestore
    .collection("reservations")
    .doc(id)
    .update({ status: "CANCELLED", updatedAt: new Date().toISOString() })
    .then(() =>
      updateFirestoreSlot(
        reservation.restaurantId,
        reservation.date.toISOString().split("T")[0],
        reservation.time,
        -1,
      ),
    )
    .then(() => {
      // Notify waitlist that a slot has opened
      import("../waitlist/waitlist.service.js")
        .then(({ notifyWaitlistForSlot }) => {
          const dateStr = reservation.date.toISOString().split("T")[0];
          notifyWaitlistForSlot(reservation.restaurantId, dateStr, reservation.time).catch(() => {});
        })
        .catch(() => {});
    })
    .catch((err) => console.error("Firestore cancel sync failed (non-fatal):", err));

  return {
    reservation,
    refund,
    cancellationPolicy: { fullRefundBeforeHours: CANCELLATION_REFUND_HOURS },
  };
};

export const updateReservation = async (
  id: string,
  userId: string,
  data: UpdateReservationInput,
) => {
  return prisma.reservation.update({
    where: { id, userId },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.time && { time: data.time }),
      ...(data.partySize && { partySize: data.partySize }),
      ...(data.specialRequests !== undefined && {
        specialRequests: data.specialRequests,
      }),
    },
  });
};

// ── internal helper ───────────────────────────────────────────────────────────

const updateFirestoreSlot = async (
  restaurantId: string,
  date: string,
  time: string,
  delta: number,
): Promise<void> => {
  const ref = adminFirestore
    .collection("restaurants")
    .doc(restaurantId)
    .collection("availability")
    .doc(date);

  const doc = await ref.get();
  if (!doc.exists) return;

  type Slot = { time: string; bookedTables: number; totalTables: number; available: boolean };
  const slots: Slot[] = doc.data()?.slots ?? [];

  const updated = slots.map((slot) => {
    if (slot.time !== time) return slot;
    const booked = Math.max(0, slot.bookedTables + delta);
    return { ...slot, bookedTables: booked, available: booked < slot.totalTables };
  });

  await ref.update({ slots: updated });
};
