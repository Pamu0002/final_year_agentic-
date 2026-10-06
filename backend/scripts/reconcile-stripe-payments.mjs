import "dotenv/config";
import pg from "pg";
import Stripe from "stripe";

const apply = process.argv.includes("--apply");
const customerEmail = (process.env.CUSTOMER_EMAIL ?? "prabhathinduwara@gmail.com").toLowerCase();

if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is missing");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const pending = await pool.query(
    `SELECT p.id, p."reservationId", p."stripePaymentId", p.status::text,
            r.status::text AS "reservationStatus"
     FROM "Payment" p
     JOIN "Reservation" r ON r.id = p."reservationId"
     JOIN "User" u ON u.id = p."userId"
     WHERE LOWER(u.email) = $1
       AND p.status = 'PENDING'::"PaymentStatus"
       AND p."stripePaymentId" LIKE 'cs_%'
     ORDER BY p."createdAt" DESC`,
    [customerEmail],
  );

  if (pending.rowCount === 0) {
    console.log(`No pending Stripe Checkout payments for ${customerEmail}`);
  }

  for (const payment of pending.rows) {
    const session = await stripe.checkout.sessions.retrieve(payment.stripePaymentId, {
      expand: ["payment_intent.latest_charge"],
    });
    console.log({
      paymentId: payment.id,
      reservationId: payment.reservationId,
      checkoutStatus: session.status,
      paymentStatus: session.payment_status,
      databasePaymentStatus: payment.status,
      databaseReservationStatus: payment.reservationStatus,
      action: apply ? "apply verified Stripe state" : "dry run",
    });

    if (!apply) continue;

    if (session.payment_status === "paid") {
      const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
      const charge = intent && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
      await pool.query("BEGIN");
      try {
        await pool.query(
          `UPDATE "Payment"
           SET status = 'SUCCEEDED'::"PaymentStatus", "receiptUrl" = $1, "updatedAt" = NOW()
           WHERE id = $2`,
          [charge?.receipt_url ?? null, payment.id],
        );
        await pool.query(
          `UPDATE "Reservation"
           SET status = 'CONFIRMED'::"ReservationStatus", "updatedAt" = NOW()
           WHERE id = $1`,
          [payment.reservationId],
        );
        await pool.query("COMMIT");
        console.log(`Reconciled paid session ${session.id}`);
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    } else if (session.status === "expired") {
      await pool.query(
        `UPDATE "Payment" SET status = 'FAILED'::"PaymentStatus", "updatedAt" = NOW() WHERE id = $1`,
        [payment.id],
      );
      console.log(`Marked expired unpaid session ${session.id} as FAILED`);
    }
  }
} finally {
  await pool.end();
}
