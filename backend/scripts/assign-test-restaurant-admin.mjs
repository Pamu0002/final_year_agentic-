import "dotenv/config";
import pg from "pg";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ADMIN_EMAIL = process.env.TEST_RESTAURANT_ADMIN_EMAIL ?? "restaurantadmin@test.lk";
const ADMIN_PASSWORD = process.env.TEST_RESTAURANT_ADMIN_PASSWORD ?? "RestAdmin123!";
const ADMIN_NAME = process.env.TEST_RESTAURANT_ADMIN_NAME ?? "Test Restaurant Admin";
const RESTAURANT_NAME = process.env.TEST_RESTAURANT_NAME ?? "Spice Route";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  throw new Error("Firebase Admin credentials are missing from backend/.env");
}
const firebaseApp = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});
const adminAuth = getAuth(firebaseApp);

let firebaseUser;
try {
  firebaseUser = await adminAuth.getUserByEmail(ADMIN_EMAIL);
  await adminAuth.updateUser(firebaseUser.uid, {
    password: ADMIN_PASSWORD,
    displayName: ADMIN_NAME,
    emailVerified: true,
  });
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  firebaseUser = await adminAuth.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_NAME,
    emailVerified: true,
  });
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const userResult = await client.query(
    `INSERT INTO "User" (id, "firebaseUid", email, name, role, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, 'RESTAURANT_ADMIN'::"Role", NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       "firebaseUid" = EXCLUDED."firebaseUid",
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       "updatedAt" = NOW()
     RETURNING id`,
    [firebaseUser.uid, ADMIN_EMAIL, ADMIN_NAME],
  );
  const adminId = userResult.rows[0].id;

  const restaurantResult = await client.query(
    `SELECT id, "adminId" FROM "Restaurant" WHERE name = $1 LIMIT 1`,
    [RESTAURANT_NAME],
  );
  if (restaurantResult.rowCount === 0) {
    throw new Error(`Restaurant "${RESTAURANT_NAME}" was not found`);
  }

  const restaurant = restaurantResult.rows[0];
  if (restaurant.adminId !== adminId) {
    await client.query(
      `UPDATE "Restaurant" SET "adminId" = $1, "updatedAt" = NOW()
       WHERE "adminId" = $2 AND id <> $3`,
      [restaurant.adminId, adminId, restaurant.id],
    );
    await client.query(
      `UPDATE "Restaurant" SET "adminId" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [adminId, restaurant.id],
    );
  }

  const reservationResult = await client.query(
    `SELECT status::text, COUNT(*)::int AS count
     FROM "Reservation" WHERE "restaurantId" = $1
     GROUP BY status ORDER BY status`,
    [restaurant.id],
  );

  await client.query("COMMIT");
  console.log(`Restaurant admin ready for ${RESTAURANT_NAME}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log("Reservations:", reservationResult.rows);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
