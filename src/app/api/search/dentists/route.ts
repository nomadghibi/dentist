import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { z } from "zod";
import { sortDentists, injectFeatured, type RankingQuery } from "@/lib/ranking";
import { validateCitySlug, validateServiceSlug } from "@/lib/slug";
import { CITY_COORDINATES, haversineDistanceMiles, parseCoordinates } from "@/lib/geo";

const searchSchema = z.object({
  city: z.string(),
  service: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
  q: z.string().optional(),
  insurance: z.string().optional(),
  acceptingNewPatients: z.enum(["true", "false"]).optional(),
  sameWeek: z.enum(["true", "false"]).optional(),
  weekend: z.enum(["true", "false"]).optional(),
  emergencyToday: z.enum(["true", "false"]).optional(),
  radius: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      city: searchParams.get("city") || "",
      service: searchParams.get("service") || undefined,
      verified: searchParams.get("verified") as "true" | "false" | undefined,
      q: searchParams.get("q") || undefined,
      insurance: searchParams.get("insurance") || undefined,
      acceptingNewPatients: searchParams.get("acceptingNewPatients") as "true" | "false" | undefined,
      sameWeek: searchParams.get("sameWeek") as "true" | "false" | undefined,
      weekend: searchParams.get("weekend") as "true" | "false" | undefined,
      emergencyToday: searchParams.get("emergencyToday") as "true" | "false" | undefined,
      radius: searchParams.get("radius") || undefined,
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
    if (validated.insurance) {
      query.insurance = validated.insurance;
    }
    if (validated.acceptingNewPatients === "true") {
      query.acceptingNewPatients = true;
    }
    if (validated.sameWeek === "true") {
      query.sameWeek = true;
    }
    if (validated.weekend === "true") {
      query.weekend = true;
    }
    if (validated.emergencyToday === "true") {
      query.emergencyToday = true;
    }
    if (validated.radius) {
      const parsed = Number.parseInt(validated.radius, 10);
      if (Number.isFinite(parsed)) {
        query.radiusMiles = parsed;
      }
    }

    const originCoords = CITY_COORDINATES[validated.city];
    if (originCoords) {
      query.originCoords = originCoords;
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

    // Apply insurance filter
    if (validated.insurance) {
      const normalized = validated.insurance.trim().toLowerCase();
      cityDentists = cityDentists.filter((d) =>
        d.insurances?.some((plan) => plan && plan.trim().toLowerCase() === normalized)
      );
    }

    // Availability filters
    if (validated.acceptingNewPatients === "true") {
      cityDentists = cityDentists.filter((d) => d.acceptingNewPatients === true);
    }
    if (validated.sameWeek === "true") {
      cityDentists = cityDentists.filter((d) => d.availabilityFlags?.same_week === true);
    }
    if (validated.weekend === "true") {
      cityDentists = cityDentists.filter((d) => d.availabilityFlags?.weekend === true);
    }
    if (validated.emergencyToday === "true") {
      cityDentists = cityDentists.filter((d) => d.availabilityFlags?.emergency_today === true);
    }

    if (query.radiusMiles && originCoords) {
      const radiusMiles = query.radiusMiles;
      cityDentists = cityDentists
        .map((d) => {
          const coords = parseCoordinates(d.lat, d.lng);
          if (!coords) return { dentist: d, distance: undefined };
          return {
            dentist: d,
            distance: haversineDistanceMiles(originCoords, coords),
          };
        })
        .filter((item) => item.distance !== undefined && item.distance <= radiusMiles)
        .map((item) => ({
          ...item.dentist,
          distanceMiles: item.distance,
        }));
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
        lat: d.lat,
        lng: d.lng,
        insurances: d.insurances,
        availabilityFlags: d.availabilityFlags,
        distanceMiles: d.distanceMiles,
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
