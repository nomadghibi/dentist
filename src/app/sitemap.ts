import { MetadataRoute } from "next";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { sql } from "drizzle-orm";

const DEFAULT_CITIES = [
  { slug: "palm-bay", name: "Palm Bay" },
  { slug: "melbourne", name: "Melbourne" },
  { slug: "space-coast", name: "Space Coast" },
];

const SERVICES = ["emergency-dentist", "pediatric-dentist", "invisalign"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";
  const lastModified = new Date();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  const cityRows = await db
    .select({
      slug: dentists.citySlug,
      name: dentists.cityName,
      lastUpdated: sql<Date>`max(${dentists.updatedAt})`,
    })
    .from(dentists)
    .groupBy(dentists.citySlug, dentists.cityName);

  const cities =
    cityRows.length > 0
      ? cityRows.map((city) => ({
          slug: city.slug,
          name: city.name,
          lastModified: city.lastUpdated ? new Date(city.lastUpdated) : lastModified,
        }))
      : DEFAULT_CITIES.map((city) => ({
          ...city,
          lastModified,
        }));

  const entries: MetadataRoute.Sitemap = [
    {
      url: normalizedBaseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${normalizedBaseUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${normalizedBaseUrl}/for-dentists`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${normalizedBaseUrl}/match`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${normalizedBaseUrl}/claim`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${normalizedBaseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${normalizedBaseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  for (const city of cities) {
    entries.push({
      url: `${normalizedBaseUrl}/fl/${city.slug}/dentists`,
      lastModified: city.lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    });

    for (const service of SERVICES) {
      entries.push({
        url: `${normalizedBaseUrl}/fl/${city.slug}/${service}`,
        lastModified: city.lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    entries.push({
      url: `${normalizedBaseUrl}/sitemaps/${city.slug}.xml`,
      lastModified: city.lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  const dentistProfiles = await db
    .select({
      slug: dentists.slug,
      citySlug: dentists.citySlug,
      updatedAt: dentists.updatedAt,
    })
    .from(dentists);

  for (const profile of dentistProfiles) {
    entries.push({
      url: `${normalizedBaseUrl}/fl/${profile.citySlug}/dentists/${profile.slug}`,
      lastModified: profile.updatedAt ? new Date(profile.updatedAt) : lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
