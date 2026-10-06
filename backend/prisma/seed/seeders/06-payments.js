import { prisma } from "../../../lib/db";
import { randomFloat, weightedRandom } from "../utils/faker";
export async function seedPayments(completedReservations) {
    console.log("  Seeding payments...");
    // only COMPLETED reservations get a payment record
    const completed = completedReservations.filter((r) => r.status === "COMPLETED");
    const payments = completed.map((reservation, i) => {
        const amount = randomFloat(800, 12000, 2);
        const statusWeights = [0.93, 0.05, 0.02];
        const statuses = ["SUCCEEDED", "FAILED", "REFUNDED"];
        const status = statuses[weightedRandom(statusWeights)];
        return {
            reservationId: reservation.id,
            userId: reservation.userId,
            amount,
            currency: "LKR",
            stripePaymentId: `pi_test_${Math.random().toString(36).substr(2, 24)}`,
            status,
            receiptUrl: status === "SUCCEEDED"
                ? `https://pay.stripe.com/receipts/test_${i}`
                : null,
            createdAt: reservation.date,
        };
    });
    await prisma.payment.createMany({ data: payments, skipDuplicates: true });
    console.log(`  ✓ ${payments.length} payment records created`);
}
