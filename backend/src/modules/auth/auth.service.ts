import { prisma } from "../../../lib/db.js";
import { sendEmail } from "../../config/nodemailer.js";
import type { User } from "../../../generated/prisma/client.js";
import type { z } from "zod";
import type { RegisterBodySchema, UpdateProfileBodySchema } from "./auth.schema.js";
import neo4j from "neo4j-driver";

export type RegisterInput = z.infer<typeof RegisterBodySchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileBodySchema>;

// ── Neo4j preference seeding ──────────────────────────────────────────────────

const _neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI ?? "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER ?? "neo4j",
    process.env.NEO4J_PASSWORD ?? "neo4j_pass",
  ),
);

async function seedUserPreferences(userId: string, cuisines: string[]): Promise<void> {
  const session = _neo4jDriver.session();
  try {
    for (const cuisine of cuisines) {
      await session.run(
        `
        MERGE (u:User {id: $userId})
        MERGE (c:Cuisine {name: $cuisine})
        MERGE (u)-[r:PREFERS]->(c)
        ON CREATE SET r.weight = 0.3
        ON MATCH  SET r.weight = r.weight + 0.1
        `,
        { userId, cuisine },
      );
    }
  } finally {
    await session.close();
  }
}

export const findOrCreateUser = async (input: RegisterInput): Promise<User> => {
  const existing = await prisma.user.findUnique({
    where: { firebaseUid: input.firebaseUid },
  });
  if (existing) return existing;

  const hasDiningPrefs = input.cuisines || input.dietaryRestrictions || input.budgetPreference || input.occasions;

  const user = await prisma.user.create({
    data: {
      firebaseUid: input.firebaseUid,
      email: input.email,
      name: input.name,
      phone: input.phone,
      role: input.role ?? "CUSTOMER",
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      preferredLanguage: input.preferredLanguage,
      diningPreferences: hasDiningPrefs
        ? {
            cuisines: input.cuisines ?? [],
            dietaryRestrictions: input.dietaryRestrictions ?? [],
            budgetPreference: input.budgetPreference,
            preferredDiningTimes: [],
            seatingPreferences: [],
            occasions: input.occasions ?? [],
          }
        : undefined,
    },
  });

  // Seed cuisine preferences into Neo4j for immediate AI personalisation
  if (input.cuisines && input.cuisines.length > 0) {
    seedUserPreferences(user.id, input.cuisines).catch((err) =>
      console.error("Neo4j preference seed failed (non-fatal):", err),
    );
  }

  await sendEmail(
    user.email,
    "Welcome to Restaurant Chatbot!",
    `<h2>Welcome ${user.name ?? ""}!</h2>
     <p>Your account is ready. Start discovering restaurants in Colombo today.</p>`,
  ).catch((err) => console.error("Welcome email failed (non-fatal):", err));

  return user;
};

export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (
  id: string,
  data: UpdateProfileInput,
): Promise<User> => {
  return prisma.user.update({ where: { id }, data });
};
