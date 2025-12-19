import "dotenv/config";
import { db } from "@/db";
import { users, dentists } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

async function createTestDentist() {
  const email = "test@dentist.com";
  const password = "test123";

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      console.log("✅ Test user already exists!");
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      
      // Check if dentist exists
      const [dentist] = await db
        .select()
        .from(dentists)
        .where(eq(dentists.userId, existingUser.id))
        .limit(1);

      if (!dentist) {
        // Create dentist record
        await db.insert(dentists).values({
          userId: existingUser.id,
          name: "Test Dental Practice",
          slug: "test-dental-practice",
          citySlug: "palm-bay",
          cityName: "Palm Bay",
          state: "FL",
          address: "123 Test Street, Palm Bay, FL 32907",
          phone: "(321) 555-1234",
          verifiedStatus: "verified",
        });
        console.log("✅ Created dentist record linked to user");
      }
      return;
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "dentist",
      })
      .returning();

    console.log("✅ Created test user!");

    // Create dentist record
    await db.insert(dentists).values({
      userId: newUser.id,
      name: "Test Dental Practice",
      slug: "test-dental-practice",
      citySlug: "palm-bay",
      cityName: "Palm Bay",
      state: "FL",
      address: "123 Test Street, Palm Bay, FL 32907",
      phone: "(321) 555-1234",
      verifiedStatus: "verified",
    });

    console.log("✅ Created dentist record!");

    console.log("\n📋 Test Credentials:");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log("\n🌐 Login URL: http://localhost:3000/dentist/login");
  } catch (error) {
    console.error("❌ Error creating test dentist:", error);
    throw error;
  }
}

createTestDentist()
  .then(() => {
    console.log("\n✅ Done! You can now login with the credentials above.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });

