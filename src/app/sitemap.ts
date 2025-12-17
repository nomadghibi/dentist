import { MetadataRoute } from "next";

const CITIES = [
  { slug: "palm-bay", name: "Palm Bay" },
  { slug: "melbourne", name: "Melbourne" },
  { slug: "space-coast", name: "Space Coast" },
];

const SERVICES = ["emergency-dentist", "pediatric-dentist", "invisalign"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-dentists`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Add city hub pages
  for (const city of CITIES) {
    entries.push({
      url: `${baseUrl}/fl/${city.slug}/dentists`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    });

    // Add service pages for each city
    for (const service of SERVICES) {
      entries.push({
        url: `${baseUrl}/fl/${city.slug}/${service}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Add city-specific sitemap
    entries.push({
      url: `${baseUrl}/sitemaps/${city.slug}.xml`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return entries;
}

