import { seedUsers } from "./seeders/01-users";
import { seedRestaurants } from "./seeders/02-restaurants";
import { seedMenuItems } from "./seeders/03-menu-items";
import { seedReviews } from "./seeders/04-reviews";
import { seedReservations } from "./seeders/05-reservations";
import { seedPayments } from "./seeders/06-payments";
import { prisma } from "../../lib/db";

async function main() {
  console.log("\nStarting PostgreSQL-only seed...\n");

  // The older seeders generate UUIDs and several models do not have natural
  // unique keys. Refuse to rerun over restaurant data instead of duplicating it.
  const existingRestaurants = await prisma.restaurant.count();
  if (existingRestaurants > 0) {
    throw new Error(
      `Database already contains ${existingRestaurants} restaurant(s). PostgreSQL-only seed was stopped to prevent duplicates.`,
    );
  }

  const users = await seedUsers();
  const adminUsers = users.filter((user) => user.role === "RESTAURANT_ADMIN");
  const customers = users.filter((user) => user.role === "CUSTOMER");

  if (adminUsers.length === 0 || customers.length === 0) {
    throw new Error("The sample users required for restaurant seeding were not created.");
  }

  const restaurants = await seedRestaurants(adminUsers);
  const menuItems = await seedMenuItems(restaurants);
  await seedReviews(restaurants, customers, menuItems);
  const reservations = await seedReservations(restaurants, customers);
  await seedPayments(reservations);

  const stats = {
    users: await prisma.user.count(),
    restaurants: await prisma.restaurant.count(),
    menuItems: await prisma.menuItem.count(),
    reviews: await prisma.review.count(),
    reservations: await prisma.reservation.count(),
    payments: await prisma.payment.count(),
  };

  console.log("\nPostgreSQL seed complete.");
  console.table(stats);
  console.log("Neo4j and Firestore were intentionally skipped.\n");
}

main()
  .catch((error) => {
    console.error("\nPostgreSQL seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
