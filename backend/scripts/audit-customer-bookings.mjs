import "dotenv/config";
import pg from "pg";

const customerEmail = (process.env.CUSTOMER_EMAIL ?? "prabhathinduwara@gmail.com").toLowerCase();
const restaurantName = process.env.TEST_RESTAURANT_NAME ?? "Spice Route";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const users = await pool.query(
    `SELECT id, email, name, role::text, "firebaseUid", "isActive"
     FROM "User"
     WHERE LOWER(email) = $1 OR LOWER(COALESCE(name, '')) LIKE $2
     ORDER BY email`,
    [customerEmail, "%prabhath%"],
  );

  const reservations = await pool.query(
    `SELECT r.id,
            r.status::text AS "reservationStatus",
            r.date,
            r.time,
            r."partySize",
            r."createdAt",
            u.id AS "userId",
            u.email,
            u.name AS "customerName",
            u."firebaseUid",
            rest.name AS restaurant,
            p.id AS "paymentId",
            p.status::text AS "paymentStatus",
            p.amount,
            p.currency,
            p."stripePaymentId"
     FROM "Reservation" r
     JOIN "User" u ON u.id = r."userId"
     JOIN "Restaurant" rest ON rest.id = r."restaurantId"
     LEFT JOIN "Payment" p ON p."reservationId" = r.id
     WHERE rest.name = $1
     ORDER BY r."createdAt" DESC
     LIMIT 20`,
    [restaurantName],
  );

  console.log("Matching customer users:");
  console.table(users.rows);
  console.log(`Latest ${restaurantName} reservations:`);
  console.table(reservations.rows);
} finally {
  await pool.end();
}
