import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const [duplicates, expiredHolds, controls] = await Promise.all([
    pool.query(
      `SELECT "userId", "restaurantId", date, time, COUNT(*)::int AS count
       FROM "Reservation"
       WHERE status IN ('PENDING', 'CONFIRMED', 'MODIFIED', 'CHECKED_IN')
       GROUP BY "userId", "restaurantId", date, time
       HAVING COUNT(*) > 1`,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM "Reservation"
       WHERE status = 'PENDING' AND "holdExpiresAt" <= NOW()`,
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM "RestaurantTable") AS tables,
         (SELECT COUNT(*)::int FROM "RestaurantSlotOverride") AS slot_overrides,
         EXISTS (
           SELECT 1 FROM pg_indexes
           WHERE indexname = 'Reservation_active_customer_slot_key'
         ) AS duplicate_guard`,
    ),
  ]);

  console.log({
    activeDuplicateGroups: duplicates.rowCount,
    expiredActiveHolds: expiredHolds.rows[0].count,
    configuredTables: controls.rows[0].tables,
    configuredSlotOverrides: controls.rows[0].slot_overrides,
    duplicateGuardInstalled: controls.rows[0].duplicate_guard,
  });
} finally {
  await pool.end();
}
