import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentistClaimTokens, users, dentists } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";

const claimCompleteSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = claimCompleteSchema.parse(body);

    // Find token
    const [claimToken] = await db
      .select()
      .from(dentistClaimTokens)
      .where(
        and(
          eq(dentistClaimTokens.token, token),
          isNull(dentistClaimTokens.usedAt)
        )
      )
      .limit(1);

    if (!claimToken) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    if (new Date(claimToken.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Token has expired." }, { status: 400 });
    }

    // Get dentist
    const [dentist] = await db
      .select()
      .from(dentists)
      .where(eq(dentists.id, claimToken.dentistId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found." }, { status: 404 });
    }

    // Create user account
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email: claimToken.email,
        passwordHash,
        role: "dentist",
      })
      .returning();

    // Mark token as used
    await db
      .update(dentistClaimTokens)
      .set({ usedAt: new Date() })
      .where(eq(dentistClaimTokens.token, token));

    // Link user to dentist
    await db
      .update(dentists)
      .set({ userId: user.id })
      .where(eq(dentists.id, claimToken.dentistId));

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error completing claim:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

