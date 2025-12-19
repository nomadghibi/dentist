import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dentistfinder.com";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const citySitemaps = ["palm-bay", "melbourne", "space-coast"].map(
    (city) => `${normalizedBaseUrl}/sitemaps/${city}.xml`
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/fl/", "/pricing", "/for-dentists", "/match"],
        disallow: ["/admin", "/api", "/dentist", "/claim", "/auth", "/_next"],
      },
    ],
    sitemap: [`${normalizedBaseUrl}/sitemap.xml`, ...citySitemaps],
    host: normalizedBaseUrl.replace(/^https?:\/\//, ""),
  };
}
