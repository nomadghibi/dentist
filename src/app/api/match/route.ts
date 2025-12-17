import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { matchSessions, matchRecommendations } from "@/db/schema";
import { matchQuizAnswersSchema } from "@/lib/validators/match";
import { matchDentists } from "@/lib/match-quiz";
import { rateLimit } from "@/lib/rate-limit";
import { validateCitySlug } from "@/lib/slug";
import { dentists } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/match
 * Submit patient matching quiz and get recommendations
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  });

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const answers = matchQuizAnswersSchema.parse(body);

    // Validate city
    if (!validateCitySlug(answers.city)) {
      return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    }

    // Fetch dentists for city
    const cityDentistsRaw = await db
      .select()
      .from(dentists)
      .where(eq(dentists.citySlug, answers.city));

    // Transform database results to match ExtendedDentist type
    // Convert null values to undefined for optional fields
    const cityDentists = cityDentistsRaw.map((dentist) => ({
      ...dentist,
      availabilityFlags: dentist.availabilityFlags || undefined,
      badges: dentist.badges || undefined,
    }));

    // Match dentists
    const matches = matchDentists(cityDentists, answers);

    // Create match session
    const [session] = await db
      .insert(matchSessions)
      .values({
        citySlug: answers.city,
        answers: answers as any,
      })
      .returning();

    // Store recommendations
    if (session && matches.length > 0) {
      await db.insert(matchRecommendations).values(
        matches.map((match) => ({
          sessionId: session.id,
          dentistId: match.dentist.id,
          score: match.score,
          reasons: match.reasons.map((r) => r.message) as any,
        }))
      );

      // Track match impression event
      const { events } = await import("@/db/schema");
      for (const match of matches) {
        await db.insert(events).values({
          dentistId: match.dentist.id,
          type: "match_impression",
          meta: { sessionId: session.id, score: match.score } as any,
        });
      }
    }

    return NextResponse.json({
      sessionId: session?.id,
      recommendations: matches.map((match) => ({
        dentist: {
          id: match.dentist.id,
          name: match.dentist.name,
          slug: match.dentist.slug,
          address: match.dentist.address,
          phone: match.dentist.phone,
          citySlug: match.dentist.citySlug,
        },
        score: match.score,
        reasons: match.reasons,
      })),
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Match quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

