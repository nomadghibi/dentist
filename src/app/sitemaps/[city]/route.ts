import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { validateCitySlug } from "@/lib/slug";

const CITIES = ["palm-bay", "melbourne", "space-coast"];
const SERVICES = ["emergency-dentist", "pediatric-dentist", "invisalign"];
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";

export async function GET(
  request: NextRequest,
  { params }: { params: { city: string } }
) {
  const { city } = params;

  if (!CITIES.includes(city) || !validateCitySlug(city)) {
    return new NextResponse("City not found", { status: 404 });
  }

  const [cityMeta] = await db
    .select({
      name: dentists.cityName,
      lastUpdated: sql<Date>`max(${dentists.updatedAt})`,
    })
    .from(dentists)
    .where(eq(dentists.citySlug, city))
    .groupBy(dentists.cityName);

  if (!cityMeta) {
    return new NextResponse("City not found", { status: 404 });
  }

  const cityDentists = await db
    .select({
      slug: dentists.slug,
      updatedAt: dentists.updatedAt,
    })
    .from(dentists)
    .where(eq(dentists.citySlug, city));

  const lastModified = (cityMeta.lastUpdated || new Date()).toISOString();

  const cityUrls = [
    {
      loc: `${baseUrl}/fl/${city}/dentists`,
      changefreq: "daily",
      priority: "0.9",
      lastmod: lastModified,
    },
    ...SERVICES.map((service) => ({
      loc: `${baseUrl}/fl/${city}/${service}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: lastModified,
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cityUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
${cityDentists
  .map((dentist) => {
    const updated = dentist.updatedAt
      ? new Date(dentist.updatedAt).toISOString()
      : lastModified;
    return `  <url>
    <loc>${baseUrl}/fl/${city}/dentists/${dentist.slug}</loc>
    <lastmod>${updated}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
