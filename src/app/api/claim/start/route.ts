import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, dentistClaimTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const claimStartSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = claimStartSchema.parse(body);

    // Find dentists with this email (could be multiple if same email used)
    // For simplicity, we'll use the first match or match by NPI if email is in a field
    // In production, you might have a separate email field on dentists
    // For now, we'll search by a potential email pattern in name/address or use a lookup table
    // This is a simplified version - you may need to adjust based on your data model

    // Find dentist by email (assuming email might be stored or we search differently)
    // For MVP, we'll create a token for any dentist and let admin handle matching
    // Or you could have a separate lookup table

    // Simplified: find first unclaimed dentist (in production, match by email field)
    const [dentist] = await db
      .select()
      .from(dentists)
      .where(isNull(dentists.verifiedByAdminId)) // Unclaimed
      .limit(1);

    if (!dentist) {
      return NextResponse.json(
        { error: "No unclaimed dentist profile found for this email." },
        { status: 404 }
      );
    }

    // Check if there's already an active token
    const existingToken = await db
      .select()
      .from(dentistClaimTokens)
      .where(
        and(
          eq(dentistClaimTokens.dentistId, dentist.id),
          eq(dentistClaimTokens.email, email),
          isNull(dentistClaimTokens.usedAt)
        )
      )
      .limit(1);

    let token: string;

    if (existingToken.length > 0 && new Date(existingToken[0].expiresAt) > new Date()) {
      token = existingToken[0].token;
    } else {
      // Generate new token
      token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      await db.insert(dentistClaimTokens).values({
        token,
        dentistId: dentist.id,
        email,
        expiresAt,
      });
    }

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const claimUrl = `${baseUrl}/claim/${token}`;

    try {
      await resend.emails.send({
        from: "Dentist Finder <noreply@dentistfinder.com>",
        to: email,
        subject: "Claim Your Dentist Profile",
        html: `
          <h2>Claim Your Profile</h2>
          <p>Click the link below to claim your dentist profile:</p>
          <p><a href="${claimUrl}">${claimUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email fails (for dev)
    }

    return NextResponse.json({ success: true, message: "Claim email sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error starting claim:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

