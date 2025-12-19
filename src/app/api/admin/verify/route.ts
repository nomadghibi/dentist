import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, adminAudit } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAdminUser } from "@/app/api/admin/helpers";

const verifySchema = z.object({
  dentistId: z.string().uuid(),
  verified: z.boolean(),
  verificationSource: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dentistId, verified, verificationSource } = verifySchema.parse(body);

    const [dentist] = await db.select().from(dentists).where(eq(dentists.id, dentistId)).limit(1);
    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    // IMPORTANT: Extract id so TS doesn't get stuck in conditional narrowing
    const adminUserId = adminUser.id;

    await db.update(dentists).set({
        verifiedStatus: verified ? "verified" : "unverified",
        verifiedAt: verified ? new Date() : null,
        verifiedByAdminId: verified ? adminUserId : null,
        verificationSource: verificationSource || null,
        updatedAt: new Date(),
    }).where(eq(dentists.id, dentistId));

    await db.insert(adminAudit).values({
      adminUserId,
      action: verified ? "verify" : "unverify",
      entityType: "dentist",
      entityId: dentistId,
      meta: { verificationSource },
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
