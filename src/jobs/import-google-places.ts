// Load .env file FIRST before any other imports
import { readFileSync, existsSync, readFileSync as readFileSyncSync } from "fs";
import { join } from "path";

/**
 * Load environment variables from .env file if it exists
 */
function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSyncSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  }
}

// Load .env file BEFORE importing db
loadEnvFile();

// Import other modules (not db yet)
import { dentists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "@/lib/slug";
import { computeCompletenessScore } from "@/lib/ranking";

interface GooglePlacesDentist {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  google_maps_url: string;
  google_rating: number | null;
  google_review_count: number | null;
  place_id: string;
  latitude: number | null;
  longitude: number | null;
  hours: string[];
  source: "google_places";
}

const CITY_SLUG_MAP: Record<string, string> = {
  "Palm Bay": "palm-bay",
  "Melbourne": "melbourne",
  "Space Coast": "space-coast",
};

/**
 * Parse hours from weekday_text format
 */
function parseHours(hours: string[]): Record<string, { open: string; close: string } | null> {
  const hoursMap: Record<string, { open: string; close: string } | null> = {};
  
  const dayMap: Record<string, string> = {
    "Monday": "monday",
    "Tuesday": "tuesday",
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
  };

  for (const hourStr of hours) {
    // Format: "Monday: 9:00 AM – 5:00 PM" or "Monday: Closed"
    const match = hourStr.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const day = dayMap[match[1]];
      const timeStr = match[2].trim();
      
      if (timeStr.toLowerCase() === "closed") {
        hoursMap[day] = null;
      } else {
        // Parse "9:00 AM – 5:00 PM"
        const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)\s*–\s*(\d+):(\d+)\s*(AM|PM)/);
        if (timeMatch) {
          hoursMap[day] = {
            open: `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`,
            close: `${timeMatch[4]}:${timeMatch[5]} ${timeMatch[6]}`,
          };
        }
      }
    }
  }

  return hoursMap;
}

/**
 * Import dentists from Google Places JSON file
 */
async function importDentistsFromFile(
  citySlug: string,
  db: any // Type will be resolved from dynamic import
): Promise<{ inserted: number; updated: number }> {
  const filePath = join(process.cwd(), "data", "seed", `${citySlug}-dentists.json`);

  if (!existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { inserted: 0, updated: 0 };
  }

  console.log(`\n📂 Reading ${filePath}...`);
  const fileContent = readFileSync(filePath, "utf-8");
  const dentistsData: GooglePlacesDentist[] = JSON.parse(fileContent);

  if (!Array.isArray(dentistsData) || dentistsData.length === 0) {
    console.log(`⚠️  No dentists found in file`);
    return { inserted: 0, updated: 0 };
  }

  console.log(`✅ Found ${dentistsData.length} dentists to import`);

  let inserted = 0;
  let updated = 0;

  for (const dentistData of dentistsData) {
    try {
      const citySlugFromData = CITY_SLUG_MAP[dentistData.city] || citySlug;
      const slug = generateSlug(dentistData.name, dentistData.place_id);

      // Check if dentist already exists by place_id or slug
      const [existing] = await db
        .select()
        .from(dentists)
        .where(eq(dentists.slug, slug))
        .limit(1);

      const hours = parseHours(dentistData.hours || []);
      
      // Determine services flags (basic detection)
      const servicesFlags: {
        emergency?: boolean;
        pediatric?: boolean;
        invisalign?: boolean;
      } = {};
      
      const nameLower = dentistData.name.toLowerCase();
      if (nameLower.includes("pediatric") || nameLower.includes("pediatric")) {
        servicesFlags.pediatric = true;
      }
      if (nameLower.includes("emergency") || nameLower.includes("urgent")) {
        servicesFlags.emergency = true;
      }
      if (nameLower.includes("invisalign") || nameLower.includes("orthodont")) {
        servicesFlags.invisalign = true;
      }

      const dentistRecord = {
        npi: null, // Google Places doesn't provide NPI
        slug,
        name: dentistData.name,
        citySlug: citySlugFromData,
        cityName: dentistData.city,
        state: dentistData.state || "FL",
        address: dentistData.address || null,
        phone: dentistData.phone || null,
        website: dentistData.website || null,
        taxonomy: null,
        lat: dentistData.latitude?.toString() || null,
        lng: dentistData.longitude?.toString() || null,
        servicesFlags: Object.keys(servicesFlags).length > 0 ? servicesFlags : null,
        insurances: null,
        languages: null,
        hours: Object.keys(hours).length > 0 ? hours : null,
        completenessScore: 0,
        verifiedStatus: "unverified" as const,
        verifiedAt: null,
        verifiedByAdminId: null,
        verificationSource: "google_places",
      };

      // Calculate completeness score
      const completenessScore = computeCompletenessScore(dentistRecord as any);
      dentistRecord.completenessScore = completenessScore;

      if (existing) {
        // Update existing dentist (preserve user edits if claimed)
        if (!existing.verifiedByAdminId && !existing.userId) {
          await db
            .update(dentists)
            .set({
              ...dentistRecord,
              completenessScore,
              updatedAt: new Date(),
            })
            .where(eq(dentists.id, existing.id));
          updated++;
          console.log(`  ✏️  Updated: ${dentistData.name}`);
        } else {
          console.log(`  ⏭️  Skipped (claimed): ${dentistData.name}`);
        }
      } else {
        // Insert new dentist
        await db.insert(dentists).values(dentistRecord);
        inserted++;
        console.log(`  ➕ Inserted: ${dentistData.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Error importing ${dentistData.name}:`, error);
    }
  }

  return { inserted, updated };
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting Google Places data import...\n");

  // Dynamically import db after env is loaded
  const { db } = await import("@/db");

  const cities = [
    { name: "Palm Bay", slug: "palm-bay" },
    { name: "Melbourne", slug: "melbourne" },
  ];

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const city of cities) {
    console.log(`\n📍 Processing ${city.name}...`);
    const result = await importDentistsFromFile(city.slug, db);
    totalInserted += result.inserted;
    totalUpdated += result.updated;
  }

  console.log(`\n✨ Import complete!`);
  console.log(`   ➕ Inserted: ${totalInserted} dentists`);
  console.log(`   ✏️  Updated: ${totalUpdated} dentists`);
}

// Run if executed directly
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

