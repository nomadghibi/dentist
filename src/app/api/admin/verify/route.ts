import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, adminAudit, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";

const verifySchema = z.object({
  dentistId: z.string().uuid(),
  verified: z.boolean(),
  verificationSource: z.string().optional(),
});

async function getAdminUser(request: NextRequest) {
  const session = await getServerSession(request);
  
  if (!session || session.role !== "admin") {
    return null;
  }

  // Fetch the full user record from database
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  
  return user || null;
}

export async function POST(request: NextRequest) {
  // TODO: Add proper admin auth check
  const adminUser = await getAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dentistId, verified, verificationSource } = verifySchema.parse(body);

    // Get dentist
    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, dentistId)).limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // Update dentist
    await db
      .update(dentists)
      .set({
        verifiedStatus: verified ? "verified" : "unverified",
        verifiedAt: verified ? new Date() : null,
        verifiedByAdminId: verified ? adminUser.id : null,
        verificationSource: verificationSource || null,
        updatedAt: new Date(),
      })
      .where(eq(dentists.id, dentistId));

    // Log audit
    await db.insert(adminAudit).values({
      adminUserId: adminUser.id,
      action: verified ? "verify" : "unverify",
      entityType: "dentist",
      entityId: dentistId,
      meta: {
        verificationSource,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error verifying dentist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

