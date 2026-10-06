import "dotenv/config";
import { adminAuth } from "../../src/config/firebase.js";
import { prisma } from "../../lib/db.js";

const ADMIN_EMAIL = process.env.TEST_RESTAURANT_ADMIN_EMAIL ?? "restaurantadmin@test.lk";
const ADMIN_PASSWORD = process.env.TEST_RESTAURANT_ADMIN_PASSWORD ?? "RestAdmin123!";
const ADMIN_NAME = process.env.TEST_RESTAURANT_ADMIN_NAME ?? "Test Restaurant Admin";
const RESTAURANT_NAME = process.env.TEST_RESTAURANT_NAME ?? "Spice Route";

async function main() {
  console.log("🍽️  Seeding Firebase restaurant admin user...\n");

  // Create or update the Firebase Auth user
  let firebaseUid: string;
  try {
    const existing = await adminAuth.getUserByEmail(ADMIN_EMAIL);
    await adminAuth.updateUser(existing.uid, { password: ADMIN_PASSWORD });
    firebaseUid = existing.uid;
    console.log(`  ✓ Updated existing Firebase user  (uid: ${firebaseUid})`);
  } catch (err: unknown) {
    if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
    const created = await adminAuth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });
    firebaseUid = created.uid;
    console.log(`  ✓ Created Firebase user  (uid: ${firebaseUid})`);
  }

  // Upsert the Postgres user as RESTAURANT_ADMIN
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { firebaseUid, role: "RESTAURANT_ADMIN", name: ADMIN_NAME },
    create: {
      firebaseUid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "RESTAURANT_ADMIN",
    },
  });

  console.log(`  ✓ Upserted Postgres user  (id: ${user.id})`);

  // Assign the requested restaurant to this test admin. If the test admin
  // previously managed another seeded restaurant, give it to the target's
  // former owner so the portal still has a single, deterministic workspace.
  const restaurant = await prisma.restaurant.findFirst({
    where: { name: RESTAURANT_NAME },
  });

  if (restaurant) {
    if (restaurant.adminId !== user.id) {
      await prisma.$transaction([
        prisma.restaurant.updateMany({
          where: { adminId: user.id, id: { not: restaurant.id } },
          data: { adminId: restaurant.adminId },
        }),
        prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { adminId: user.id },
        }),
      ]);
    }
    console.log(`  ✓ Assigned restaurant "${restaurant.name}" (id: ${restaurant.id})`);
  } else {
    console.log(`  ⚠️  Restaurant "${RESTAURANT_NAME}" not found — run the main seed first`);
  }

  console.log("\n✅ Restaurant admin ready");
  console.log(`   Email:      ${ADMIN_EMAIL}`);
  console.log(`   Password:   ${ADMIN_PASSWORD}`);
  if (restaurant) console.log(`   Restaurant: ${restaurant.name}`);
}

main()
  .catch((err) => {
    console.error("\n❌ Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
