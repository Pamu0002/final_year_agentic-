import { prisma } from "../../../lib/db.js";
import { stripe } from "../../config/stripe.js";

export type RefundOutcome =
  | { status: "REFUNDED"; amount: number; refundId: string }
  | { status: "ALREADY_REFUNDED"; amount: number; refundId: string | null }
  | { status: "PENDING_CANCELLED"; amount: number }
  | { status: "NOT_APPLICABLE"; amount: number };

const resolvePaymentIntentId = async (stripePaymentId: string): Promise<string> => {
  if (stripePaymentId.startsWith("pi_")) return stripePaymentId;
  if (!stripePaymentId.startsWith("cs_")) {
    throw Object.assign(new Error("Unsupported Stripe payment reference"), { status: 409 });
  }

  const session = await stripe.checkout.sessions.retrieve(stripePaymentId);
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) {
    throw Object.assign(new Error("Stripe payment has not completed"), { status: 409 });
  }
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
};

export const refundReservationPayment = async (
  reservationId: string,
  reason: "CUSTOMER_CANCELLATION" | "RESTAURANT_CANCELLATION" | "RESTAURANT_CONFIRMATION_TIMEOUT",
): Promise<RefundOutcome> => {
  const payment = await prisma.payment.findUnique({ where: { reservationId } });
  if (!payment) return { status: "NOT_APPLICABLE", amount: 0 };

  if (payment.status === "REFUNDED") {
    return { status: "ALREADY_REFUNDED", amount: payment.amount, refundId: payment.refundId };
  }

  if (payment.status === "PENDING") {
    if (payment.stripePaymentId?.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(payment.stripePaymentId);
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(session.id);
      }
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { status: "PENDING_CANCELLED", amount: payment.amount };
  }

  if (payment.status !== "SUCCEEDED" || !payment.stripePaymentId) {
    return { status: "NOT_APPLICABLE", amount: payment.amount };
  }

  const paymentIntentId = await resolvePaymentIntentId(payment.stripePaymentId);
  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: { reservationId, cancellationReason: reason },
    },
    { idempotencyKey: `reservation-refund-${reservationId}` },
  );

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REFUNDED", refundId: refund.id, refundedAt: new Date() },
  });

  return { status: "REFUNDED", amount: payment.amount, refundId: refund.id };
};
