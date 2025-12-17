import { db } from "@/db";
import { dentists, ingestionRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "@/lib/slug";
import { computeCompletenessScore } from "@/lib/ranking";

interface NPPESProvider {
  NPI: string;
  providerName?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  location?: {
    address1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    telephoneNumber?: string;
  };
  taxonomy?: Array<{
    code?: string;
    desc?: string;
    primary?: boolean;
  }>;
  coordinates?: {
    latitude?: string;
    longitude?: string;
  };
}

const CITY_MAPPINGS: Record<string, { name: string; state: string }> = {
  "palm-bay": { name: "Palm Bay", state: "FL" },
  "melbourne": { name: "Melbourne", state: "FL" },
  "space-coast": { name: "Space Coast", state: "FL" },
};

/**
 * Fetch dentists from NPPES API for a given city
 */
async function fetchNPPESDentists(citySlug: string): Promise<NPPESProvider[]> {
  const city = CITY_MAPPINGS[citySlug];
  if (!city) {
    throw new Error(`Invalid city slug: ${citySlug}`);
  }

  const results: NPPESProvider[] = [];
  let page = 1;
  const limit = 200; // NPPES API limit

  while (true) {
    // NPPES API endpoint
    const url = new URL("https://npiregistry.cms.hhs.gov/api/");
    url.searchParams.set("version", "2.1");
    url.searchParams.set("city", city.name);
    url.searchParams.set("state", city.state);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String((page - 1) * limit));

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`NPPES API error: ${response.statusText}`);
      }

      const data = await response.json();
      const providers = data.results || [];

      if (providers.length === 0) {
        break;
      }

      // Filter to dental taxonomy codes
      const dentalProviders = providers.filter((provider: NPPESProvider) => {
        if (!provider.taxonomy || provider.taxonomy.length === 0) {
          return false;
        }

        // Check for dental taxonomy codes (1223* family or explicit Dentist)
        return provider.taxonomy.some((tax) => {
          const code = tax.code || "";
          const desc = (tax.desc || "").toLowerCase();
          return (
            code.startsWith("1223") ||
            desc.includes("dentist") ||
            desc.includes("dental")
          );
        });
      });

      results.push(...dentalProviders);

      if (providers.length < limit) {
        break;
      }

      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  return results;
}

/**
 * Normalize NPPES provider data to our dentist schema
 */
function normalizeProvider(provider: NPPESProvider, citySlug: string): {
  npi: string;
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  state: string;
  address: string | null;
  phone: string | null;
  taxonomy: string | null;
  lat: string | null;
  lng: string | null;
  servicesFlags: {
    emergency?: boolean;
    pediatric?: boolean;
    invisalign?: boolean;
  };
} {
  const city = CITY_MAPPINGS[citySlug];
  const name =
    provider.organizationName ||
    `${provider.firstName || ""} ${provider.lastName || ""}`.trim() ||
    provider.providerName ||
    "Unknown";

  const slug = generateSlug(name, provider.NPI);

  const address = provider.location?.address1
    ? [
        provider.location.address1,
        provider.location.city,
        provider.location.state,
        provider.location.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const primaryTaxonomy = provider.taxonomy?.find((t) => t.primary) || provider.taxonomy?.[0];
  const taxonomyCode = primaryTaxonomy?.code || null;

  // Determine services from taxonomy or description
  const servicesFlags: {
    emergency?: boolean;
    pediatric?: boolean;
    invisalign?: boolean;
  } = {};

  const taxonomyDesc = (primaryTaxonomy?.desc || "").toLowerCase();
  if (taxonomyDesc.includes("pediatric")) {
    servicesFlags.pediatric = true;
  }
  if (taxonomyDesc.includes("emergency") || taxonomyDesc.includes("urgent")) {
    servicesFlags.emergency = true;
  }
  if (taxonomyDesc.includes("orthodont") || taxonomyDesc.includes("invisalign")) {
    servicesFlags.invisalign = true;
  }

  return {
    npi: provider.NPI,
    slug,
    name,
    citySlug,
    cityName: city.name,
    state: city.state,
    address,
    phone: provider.location?.telephoneNumber || null,
    taxonomy: taxonomyCode,
    lat: provider.coordinates?.latitude || null,
    lng: provider.coordinates?.longitude || null,
    servicesFlags,
  };
}

/**
 * Main ingestion function
 */
export async function ingestNPIForCity(citySlug: string): Promise<{
  inserted: number;
  updated: number;
  errors: Array<{ message: string; npi?: string }>;
}> {
  const runId = crypto.randomUUID();
  const startedAt = new Date();

  // Create ingestion run record
  await db.insert(ingestionRuns).values({
    id: runId,
    citySlug,
    startedAt,
    insertedCount: 0,
    updatedCount: 0,
    errors: [],
  });

  const errors: Array<{ message: string; npi?: string }> = [];
  let inserted = 0;
  let updated = 0;

  try {
    // Fetch providers from NPPES
    const providers = await fetchNPPESDentists(citySlug);

    for (const provider of providers) {
      try {
        const normalized = normalizeProvider(provider, citySlug);

        // Check if dentist exists by NPI
        const [existing] = await db
          .select()
          .from(dentists)
          .where(eq(dentists.npi, normalized.npi))
          .limit(1);

        if (existing) {
          // Update only if not claimed (preserve user edits)
          if (!existing.verifiedByAdminId) {
            const completenessScore = computeCompletenessScore({
              ...existing,
              ...normalized,
            });

            await db
              .update(dentists)
              .set({
                ...normalized,
                completenessScore,
                updatedAt: new Date(),
              })
              .where(eq(dentists.npi, normalized.npi));

            updated++;
          }
        } else {
          // Insert new dentist
          const completenessScore = computeCompletenessScore({
            ...normalized,
            completenessScore: 0,
            verifiedStatus: "unverified",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);

          await db.insert(dentists).values({
            ...normalized,
            completenessScore,
          });

          inserted++;
        }
      } catch (error) {
        errors.push({
          message: error instanceof Error ? error.message : "Unknown error",
          npi: provider.NPI,
        });
      }
    }

    // Update ingestion run
    await db
      .update(ingestionRuns)
      .set({
        finishedAt: new Date(),
        insertedCount: inserted,
        updatedCount: updated,
        errors,
      })
      .where(eq(ingestionRuns.id, runId));

    return { inserted, updated, errors };
  } catch (error) {
    errors.push({
      message: error instanceof Error ? error.message : "Ingestion failed",
    });

    await db
      .update(ingestionRuns)
      .set({
        finishedAt: new Date(),
        errors,
      })
      .where(eq(ingestionRuns.id, runId));

    return { inserted, updated, errors };
  }
}

