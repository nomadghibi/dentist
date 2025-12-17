import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentistClaimTokens, dentists } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

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
    return NextResponse.json({ valid: false });
  }

  if (new Date(claimToken.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, expired: true });
  }

  const [dentist] = await db
    .select()
    .from(dentists)
    .where(eq(dentists.id, claimToken.dentistId))
    .limit(1);

  if (!dentist) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    dentist: {
      id: dentist.id,
      name: dentist.name,
    },
  });
}

