import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "@/lib/auth";

/**
 * Seed script to create initial admin user
 * Run with: pnpm tsx src/db/seed.ts
 */
async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";

  console.log("Creating admin user...");

  try {
    const passwordHash = await hashPassword(adminPassword);

    await db.insert(users).values({
      email: adminEmail,
      passwordHash,
      role: "admin",
    });

    console.log(`Admin user created: ${adminEmail}`);
    console.log("Password:", adminPassword);
    console.log("⚠️  Please change the default password!");
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) {
      console.log("Admin user already exists");
    } else {
      console.error("Error creating admin user:", error);
      throw error;
    }
  }
}

seed()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

