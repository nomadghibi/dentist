import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { z } from "zod";
import { sortDentists, injectFeatured, type RankingQuery } from "@/lib/ranking";
import { validateCitySlug, validateServiceSlug } from "@/lib/slug";

const searchSchema = z.object({
  city: z.string(),
  service: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      city: searchParams.get("city") || "",
      service: searchParams.get("service") || undefined,
      verified: searchParams.get("verified") as "true" | "false" | undefined,
      q: searchParams.get("q") || undefined,
    };

    const validated = searchSchema.parse(params);

    if (!validateCitySlug(validated.city)) {
      return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    }

    if (validated.service && !validateServiceSlug(validated.service)) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    // Build query
    const query: RankingQuery = {};
    if (validated.service) {
      query.service = validated.service;
    }
    if (validated.verified === "true") {
      query.verifiedOnly = true;
    }

    // Fetch dentists
    let cityDentists = await db
      .select()
      .from(dentists)
      .where(
        and(
          eq(dentists.citySlug, validated.city),
          validated.verified === "true" ? eq(dentists.verifiedStatus, "verified") : undefined,
          validated.q ? ilike(dentists.name, `%${validated.q}%`) : undefined
        )
      );

    // Apply service filter
    if (validated.service) {
      const serviceMap: Record<string, string> = {
        "emergency-dentist": "emergency",
        "pediatric-dentist": "pediatric",
        "invisalign": "invisalign",
      };
      const serviceKey = serviceMap[validated.service];
      if (serviceKey) {
        cityDentists = cityDentists.filter((d) => {
          return d.servicesFlags?.[serviceKey as keyof typeof d.servicesFlags] === true;
        });
      }
    }

    // Sort
    const sorted = sortDentists(cityDentists, query);

    // Get featured - select all fields to match Dentist type
    const featuredDentists = await db
      .select()
      .from(dentists)
      .innerJoin(subscriptions, eq(dentists.id, subscriptions.dentistId))
      .where(
        and(
          eq(dentists.citySlug, validated.city),
          eq(subscriptions.status, "active"),
          or(eq(subscriptions.plan, "pro"), eq(subscriptions.plan, "premium"))
        )
      )
      .then((results) => results.map((r) => r.dentists)); // Extract dentists from join result

    const finalList = injectFeatured(sorted, featuredDentists, {
      maxFeatured: 5,
      positions: [1, 3, 6, 10, 15],
    });

    return NextResponse.json({
      dentists: finalList.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        address: d.address,
        phone: d.phone,
        verifiedStatus: d.verifiedStatus,
        isSponsored: d.isSponsored,
      })),
      count: finalList.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error searching dentists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

