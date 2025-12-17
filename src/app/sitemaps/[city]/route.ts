import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { eq } from "drizzle-orm";

const CITIES = ["palm-bay", "melbourne", "space-coast"];
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;

  if (!CITIES.includes(city)) {
    return new NextResponse("City not found", { status: 404 });
  }

  // Fetch all dentists for this city
  const cityDentists = await db
    .select({
      slug: dentists.slug,
      updatedAt: dentists.updatedAt,
    })
    .from(dentists)
    .where(eq(dentists.citySlug, city));

  const lastModified = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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

