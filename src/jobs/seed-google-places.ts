import { writeFile, mkdir } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { writeCSV } from "@/lib/csv";

/**
 * Load environment variables from .env file if it exists
 */
function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
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

// Load .env file if it exists
loadEnvFile();

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    weekday_text?: string[];
  };
  url?: string;
}

interface DentistData extends Record<string, unknown> {
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

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("ERROR: GOOGLE_MAPS_API_KEY environment variable is not set");
  process.exit(1);
}

// Use the new Places API (New)
const BASE_URL = "https://places.googleapis.com/v1";

/**
 * Retry wrapper for API calls
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry attempt ${i + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Search for places using Places API (New) - Text Search
 */
async function searchPlaces(query: string, nextPageToken?: string): Promise<{
  results: Array<{ place_id: string; name: string }>;
  nextPageToken?: string;
}> {
  const url = `${BASE_URL}/places:searchText`;

  const body: any = {
    textQuery: query,
    maxResultCount: 20,
  };

  if (nextPageToken) {
    body.pageToken = nextPageToken;
  }

  // Field mask for search results - minimal fields needed
  const fieldMask = "places.id,places.displayName";

  const response = await retry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY!,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
    return res.json();
  });

  if (response.error) {
    throw new Error(`Google Places API error: ${response.error.message || JSON.stringify(response.error)}`);
  }

  const places = response.places || [];
  return {
    results: places.map((p: any) => ({
      place_id: p.id,
      name: p.displayName?.text || p.name || "",
    })),
    nextPageToken: response.nextPageToken,
  };
}

/**
 * Get place details using Places API (New)
 */
async function getPlaceDetails(placeId: string): Promise<GooglePlace> {
  const url = `${BASE_URL}/places/${placeId}`;
  const fields = [
    "id",
    "displayName",
    "formattedAddress",
    "nationalPhoneNumber",
    "websiteUri",
    "rating",
    "userRatingCount",
    "location",
    "regularOpeningHours",
    "googleMapsUri",
  ].join(",");

  const response = await retry(async () => {
    const res = await fetch(`${url}?fields=${fields}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": API_KEY!,
        "X-Goog-FieldMask": fields,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
    return res.json();
  });

  if (response.error) {
    throw new Error(`Google Places API error: ${response.error.message || JSON.stringify(response.error)}`);
  }

  // Transform new API format to our expected format
  return {
    place_id: response.id || placeId,
    name: response.displayName?.text || response.name || "",
    formatted_address: response.formattedAddress || "",
    formatted_phone_number: response.nationalPhoneNumber || "",
    website: response.websiteUri || "",
    rating: response.rating || undefined,
    user_ratings_total: response.userRatingCount || undefined,
    geometry: response.location ? {
      location: {
        lat: response.location.latitude,
        lng: response.location.longitude,
      },
    } : undefined,
    opening_hours: response.regularOpeningHours?.weekdayDescriptions ? {
      weekday_text: response.regularOpeningHours.weekdayDescriptions,
    } : undefined,
    url: response.googleMapsUri || undefined,
  };
}

/**
 * Parse address into components
 */
function parseAddress(formattedAddress: string): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  // Simple parsing - Google usually formats as "Street, City, State ZIP"
  const parts = formattedAddress.split(",").map((p) => p.trim());
  
  let address = formattedAddress;
  let city = "";
  let state = "";
  let zip = "";

  if (parts.length >= 3) {
    address = parts.slice(0, -2).join(", ");
    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    
    if (stateZipMatch) {
      state = stateZipMatch[1];
      zip = stateZipMatch[2];
      city = parts[parts.length - 2];
    } else {
      // Fallback: assume last part is state/zip
      const stateMatch = lastPart.match(/^([A-Z]{2})/);
      if (stateMatch) {
        state = stateMatch[1];
        city = parts[parts.length - 2];
      }
    }
  } else if (parts.length === 2) {
    address = parts[0];
    const secondPart = parts[1];
    const stateZipMatch = secondPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZipMatch) {
      state = stateZipMatch[1];
      zip = stateZipMatch[2];
    }
  }

  return { address, city, state, zip };
}

/**
 * Transform Google Place to DentistData
 */
function transformPlace(place: GooglePlace): DentistData {
  const parsed = parseAddress(place.formatted_address || "");
  
  return {
    name: place.name || "",
    address: parsed.address,
    city: parsed.city,
    state: parsed.state || "FL",
    zip: parsed.zip,
    phone: place.formatted_phone_number || "",
    website: place.website || "",
    google_maps_url: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    google_rating: place.rating || null,
    google_review_count: place.user_ratings_total || null,
    place_id: place.place_id,
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    hours: place.opening_hours?.weekday_text || [],
    source: "google_places",
  };
}

/**
 * Fetch dentists for a city
 */
async function fetchDentistsForCity(
  cityName: string,
  state: string = "FL",
  targetCount: number = 20
): Promise<DentistData[]> {
  console.log(`\n🔍 Searching for dentists in ${cityName}, ${state}...`);
  
  const query = `dentist in ${cityName}, ${state}`;
  const seenPlaceIds = new Set<string>();
  const dentists: DentistData[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 0;
  const maxPages = 5; // Limit to avoid excessive API calls

  while (dentists.length < targetCount && pageCount < maxPages) {
    pageCount++;
    console.log(`  📄 Fetching page ${pageCount}...`);

    // Wait before pagination (Google requires delay for next_page_token)
    if (nextPageToken) {
      console.log("  ⏳ Waiting 2 seconds for pagination token...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const searchResults = await searchPlaces(query, nextPageToken);
    
    if (searchResults.results.length === 0) {
      console.log("  ⚠️  No more results available");
      break;
    }

    console.log(`  ✅ Found ${searchResults.results.length} results on this page`);

    // Process each result
    for (const result of searchResults.results) {
      if (seenPlaceIds.has(result.place_id)) {
        continue;
      }

      if (dentists.length >= targetCount) {
        break;
      }

      try {
        console.log(`  📋 Fetching details for: ${result.name}`);
        const placeDetails = await getPlaceDetails(result.place_id);
        
        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));

        const dentist = transformPlace(placeDetails);
        dentists.push(dentist);
        seenPlaceIds.add(result.place_id);
        
        console.log(`  ✅ Added: ${dentist.name} (${dentists.length}/${targetCount})`);
      } catch (error) {
        console.error(`  ❌ Error fetching details for ${result.name}:`, error);
      }
    }

    nextPageToken = searchResults.nextPageToken;
    
    if (!nextPageToken) {
      console.log("  ⚠️  No more pages available");
      break;
    }
  }

  console.log(`\n✅ Found ${dentists.length} unique dentists for ${cityName}, ${state}`);
  if (dentists.length < targetCount) {
    console.log(`  ⚠️  Warning: Only found ${dentists.length} dentists (target was ${targetCount})`);
  }

  return dentists;
}

/**
 * Save data to JSON and CSV
 */
async function saveData(citySlug: string, dentists: DentistData[]): Promise<void> {
  const outputDir = join(process.cwd(), "data", "seed");
  
  // Create directory if it doesn't exist
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Save JSON
  const jsonPath = join(outputDir, `${citySlug}-dentists.json`);
  await writeFile(jsonPath, JSON.stringify(dentists, null, 2), "utf-8");
  console.log(`  💾 Saved JSON: ${jsonPath}`);

  // Save CSV
  const csvPath = join(outputDir, `${citySlug}-dentists.csv`);
  const csvContent = writeCSV(dentists as unknown as Record<string, unknown>[], [
    "name",
    "address",
    "city",
    "state",
    "zip",
    "phone",
    "website",
    "google_maps_url",
    "google_rating",
    "google_review_count",
    "place_id",
    "latitude",
    "longitude",
    "hours",
    "source",
  ]);
  await writeFile(csvPath, csvContent, "utf-8");
  console.log(`  💾 Saved CSV: ${csvPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting Google Places dentist seeding...");
  console.log(`📍 API Key: ${API_KEY?.substring(0, 10)}...`);

  const cities = [
    { name: "Palm Bay", slug: "palm-bay", state: "FL" },
    { name: "Melbourne", slug: "melbourne", state: "FL" },
    { name: "Space Coast", slug: "space-coast", state: "FL" },
  ];

  for (const city of cities) {
    try {
      const dentists = await fetchDentistsForCity(city.name, city.state, 20);
      await saveData(city.slug, dentists);
    } catch (error) {
      console.error(`❌ Error processing ${city.name}:`, error);
    }
  }

  console.log("\n✨ Seeding complete!");
}

// Run if executed directly
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { fetchDentistsForCity, transformPlace };

