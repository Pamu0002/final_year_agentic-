import { stripe } from "../../config/stripe.js";
import { prisma } from "../../../lib/db.js";
import type Stripe from "stripe";
import { RESERVATION_DEPOSIT_LKR, RESERVATION_HOLD_MINUTES } from "../../config/payments.js";
import { markPaidReservationAwaitingConfirmation } from "../reservation/reservation.service.js";

const SERVICE_CHARGE_RATE = 0.10;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3001";

export interface OrderItemInput {
  menuItemId?: string | null;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface VerifiedOrder {
  verifiedItems: OrderItemInput[];
  deposit: number;
  subtotal: number;
  serviceCharge: number;
  total: number;
}

const computeVerifiedTotal = (
  orderItems: OrderItemInput[],
  dbPriceMap: Map<string, number>,
  deposit = RESERVATION_DEPOSIT_LKR,
): VerifiedOrder => {
  const verifiedItems = orderItems.map((item) => {
    if (!item.menuItemId) return item;
    const dbPrice = dbPriceMap.get(item.menuItemId);
    if (dbPrice === undefined) {
      throw Object.assign(
        new Error(`Menu item ${item.menuItemId} not found or unavailable`),
        { status: 400 },
      );
    }
    return { ...item, price: dbPrice };
  });

  const subtotal = verifiedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE);
  return { verifiedItems, deposit, subtotal, serviceCharge, total: deposit + subtotal + serviceCharge };
};

// Resolves authoritative prices from the DB for any item that references a
// menuItemId. Client-supplied prices are never trusted for identified menu items.
const verifyOrderAndComputeTotal = async (
  orderItems: OrderItemInput[],
  restaurantId: string,
): Promise<VerifiedOrder> => {
  const menuItemIds = orderItems
    .filter((i) => i.menuItemId)
    .map((i) => i.menuItemId as string);

  const dbItems = menuItemIds.length
    ? await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
      })
    : [];
  const dbPriceMap = new Map(dbItems.map((m) => [m.id, m.price]));

  return computeVerifiedTotal(orderItems, dbPriceMap);
};

const getPayableReservation = async (reservationId: string, userId: string) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, userId },
    include: { payment: true },
  });
  if (!reservation) {
    throw Object.assign(new Error("Reservation not found"), { status: 404 });
  }
  if (reservation.status === "CANCELLED" || reservation.status === "COMPLETED") {
    throw Object.assign(new Error("This reservation can no longer be paid"), { status: 409 });
  }
  if (reservation.payment?.status === "SUCCEEDED") {
    throw Object.assign(new Error("This reservation has already been paid"), { status: 409 });
  }
  return reservation;
};

export const createPaymentIntent = async (
  reservationId: string,
  userId: string,
  userEmail: string,
  orderItems: OrderItemInput[],
): Promise<{ clientSecret: string; paymentId: string; amount: number }> => {
  const reservation = await getPayableReservation(reservationId, userId);
  const { verifiedItems, total } = await verifyOrderAndComputeTotal(orderItems, reservation.restaurantId);

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: "lkr",
    metadata: { reservationId, userId },
    receipt_email: userEmail,
  });

  const payment = await prisma.payment.upsert({
    where: { reservationId },
    create: {
      reservationId,
      userId,
      amount: total,
      currency: "LKR",
      stripePaymentId: intent.id,
      status: "PENDING",
      orderItems: verifiedItems as object[],
    },
    update: {
      amount: total,
      stripePaymentId: intent.id,
      status: "PENDING",
      orderItems: verifiedItems as object[],
    },
  });

  return { clientSecret: intent.client_secret!, paymentId: payment.id, amount: total };
};

export const createCheckoutSession = async (
  reservationId: string,
  userId: string,
  userEmail: string,
  orderItems: OrderItemInput[],
): Promise<{ paymentUrl: string; paymentId: string; amount: number }> => {
  const reservation = await getPayableReservation(reservationId, userId);
  const { verifiedItems, deposit, serviceCharge, total } =
    await verifyOrderAndComputeTotal(orderItems, reservation.restaurantId);

  const lineItems = [
    {
      price_data: {
        currency: "lkr" as const,
        product_data: { name: "Restaurant Reservation Deposit" },
        unit_amount: Math.round(deposit * 100),
      },
      quantity: 1,
    },
    ...verifiedItems.map((item) => ({
      price_data: {
        currency: "lkr" as const,
        product_data: { name: item.name, ...(item.category ? { description: item.category } : {}) },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    ...(serviceCharge > 0 ? [{
      price_data: {
        currency: "lkr" as const,
        product_data: { name: "Service Charge (10%)" },
        unit_amount: Math.round(serviceCharge * 100),
      },
      quantity: 1,
    }] : []),
  ];

  const checkoutExpiresAt = Math.floor(Date.now() / 1000) + RESERVATION_HOLD_MINUTES * 60;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/payment/cancel?reservation_id=${reservationId}`,
    customer_email: userEmail,
    metadata: { reservationId, userId, reservationDeposit: String(deposit) },
    // Stripe requires Checkout expiry to be at least 30 minutes and strictly
    // less than 24 hours. A short hold also avoids blocking restaurant capacity.
    expires_at: checkoutExpiresAt,
  });

  const payment = await prisma.payment.upsert({
    where: { reservationId },
    create: {
      reservationId,
      userId,
      amount: total,
      currency: "LKR",
      stripePaymentId: session.id,
      status: "PENDING",
      checkoutUrl: session.url,
      orderItems: verifiedItems as object[],
    },
    update: {
      amount: total,
      stripePaymentId: session.id,
      status: "PENDING",
      checkoutUrl: session.url,
      orderItems: verifiedItems as object[],
    },
  });

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { holdExpiresAt: new Date(checkoutExpiresAt * 1000) },
  });

  return { paymentUrl: session.url!, paymentId: payment.id, amount: total };
};

/**
 * Authenticated fallback for local development and delayed webhooks.
 * Stripe remains authoritative; a client cannot mark its own payment as paid.
 */
export const confirmCheckoutSession = async (
  sessionId: string,
  userId: string,
): Promise<{ paymentStatus: string; reservationStatus: string }> => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });

  if (session.metadata?.userId !== userId) {
    throw Object.assign(new Error("Checkout session not found"), { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: sessionId, userId },
  });
  if (!payment) {
    throw Object.assign(new Error("Payment record not found"), { status: 404 });
  }

  if (session.payment_status === "paid") {
    const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
    const charge = intent && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        ...(charge?.receipt_url ? { receiptUrl: charge.receipt_url } : {}),
      },
    });
    await markPaidReservationAwaitingConfirmation(payment.reservationId);
  } else if (session.status === "expired") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  const updated = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id },
    include: { reservation: { select: { status: true } } },
  });
  return {
    paymentStatus: updated.status,
    reservationStatus: updated.reservation.status,
  };
};

export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string,
): Promise<void> => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  // ── Checkout session completed ──────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await prisma.payment.update({
      where: { stripePaymentId: session.id },
      data: { status: "SUCCEEDED", receiptUrl: session.url ?? undefined },
      include: {
        user: true,
        reservation: { include: { restaurant: true } },
      },
    }).catch(() => null);

    if (payment) {
      await markPaidReservationAwaitingConfirmation(payment.reservationId);
    }
  }

  // ── PaymentIntent succeeded (legacy / fallback) ─────────────────
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { reservationId, userId } = intent.metadata;
    if (!reservationId) return; // not from our checkout flow

    // Skip if already handled via checkout.session.completed
    const existing = await prisma.payment.findUnique({ where: { reservationId } });
    if (existing?.status === "SUCCEEDED") return;

    if (!existing) {
      await prisma.payment.create({
        data: {
          reservationId,
          userId,
          amount: intent.amount / 100,
          currency: intent.currency.toUpperCase(),
          stripePaymentId: intent.id,
          status: "SUCCEEDED",
        },
      });
    } else {
      await prisma.payment.update({
        where: { reservationId },
        // Keep the Checkout Session reference so confirm-session and the
        // checkout.session.completed webhook can find the same payment.
        data: {
          status: "SUCCEEDED",
          ...(existing.stripePaymentId?.startsWith("cs_") ? {} : { stripePaymentId: intent.id }),
        },
      });
    }

    await markPaidReservationAwaitingConfirmation(reservationId);
  }

  // Release the slot when an unpaid Checkout session expires.
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservationId = session.metadata?.reservationId;
    await prisma.payment.updateMany({
      where: { stripePaymentId: session.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    if (reservationId) {
      await prisma.reservation.updateMany({
        where: { id: reservationId, status: "PENDING" },
        data: {
          status: "CANCELLED",
          holdExpiresAt: null,
          confirmationExpiresAt: null,
          cancelledAt: new Date(),
          cancelledBy: "SYSTEM",
          cancellationReason: "PAYMENT_HOLD_EXPIRED",
        },
      });
    }
  }

  // ── PaymentIntent failed ────────────────────────────────────────
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { reservationId, userId } = intent.metadata;
    if (!reservationId) return;

    await prisma.payment.upsert({
      where: { reservationId },
      create: {
        reservationId,
        userId,
        amount: intent.amount / 100,
        currency: intent.currency.toUpperCase(),
        stripePaymentId: intent.id,
        status: "FAILED",
      },
      update: { status: "FAILED" },
    });
  }
};

export const getPaymentHistory = async (userId: string) => {
  return prisma.payment.findMany({
    where: { userId },
    include: { reservation: { include: { restaurant: true } } },
    orderBy: { createdAt: "desc" },
  });
};
