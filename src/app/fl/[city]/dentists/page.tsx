import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { buildCityHubMetadata, buildCanonical } from "@/lib/seo";
import { validateCitySlug } from "@/lib/slug";
import { sortDentists, injectFeatured, type RankingQuery } from "@/lib/ranking";
import DentistCard from "@/components/DentistCard";
import Filters from "@/components/Filters";
import Link from "next/link";

const CITY_NAMES: Record<string, string> = {
  "palm-bay": "Palm Bay",
  "melbourne": "Melbourne",
  "space-coast": "Space Coast",
};

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  if (!validateCitySlug(city)) {
    return {};
  }
  const cityName = CITY_NAMES[city] || city;
  return buildCityHubMetadata(cityName, city);
}

export default async function CityDentistsPage({ params, searchParams }: PageProps) {
  const { city } = await params;
  const search = await searchParams;

  if (!validateCitySlug(city)) {
    notFound();
  }

  const cityName = CITY_NAMES[city] || city;

  // Build query filters
  const query: RankingQuery = {};
  if (search.service) {
    query.service = String(search.service);
  }
  if (search.verified === "true") {
    query.verifiedOnly = true;
  }

  // Fetch dentists for this city
  let cityDentists = await db
    .select()
    .from(dentists)
    .where(
      and(
        eq(dentists.citySlug, city),
        query.verifiedOnly ? eq(dentists.verifiedStatus, "verified") : undefined
      )
    );

  // Apply service filter if specified
  if (query.service) {
    const serviceMap: Record<string, string> = {
      "emergency-dentist": "emergency",
      "pediatric-dentist": "pediatric",
      "invisalign": "invisalign",
    };
    const serviceKey = serviceMap[query.service];
    if (serviceKey) {
      cityDentists = cityDentists.filter((d) => {
        return d.servicesFlags?.[serviceKey as keyof typeof d.servicesFlags] === true;
      });
    }
  }

  // Sort organically
  const sorted = sortDentists(cityDentists, query);

  // Fetch featured dentists (active pro/premium subscriptions) - select all fields to match Dentist type
  const featuredDentists = await db
    .select()
    .from(dentists)
    .innerJoin(subscriptions, eq(dentists.id, subscriptions.dentistId))
    .where(
      and(
        eq(dentists.citySlug, city),
        eq(subscriptions.status, "active"),
        or(eq(subscriptions.plan, "pro"), eq(subscriptions.plan, "premium"))
      )
    )
    .then((results) => results.map((r) => r.dentists)); // Extract dentists from join result

  // Inject featured placements
  const finalList = injectFeatured(sorted, featuredDentists, {
    maxFeatured: 5,
    positions: [1, 3, 6, 10, 15],
  });

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Dentists in ${cityName}, FL`,
    description: `Verified dentists serving patients in ${cityName}, Florida.`,
    url: buildCanonical(`/fl/${city}/dentists`),
    itemListElement: finalList.map((dentist, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: buildCanonical(`/fl/${city}/dentists/${dentist.slug}`),
      name: dentist.name,
    })),
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Florida",
        item: buildCanonical("/fl"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${cityName} Dentists`,
        item: buildCanonical(`/fl/${city}/dentists`),
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([listJsonLd, breadcrumbsJsonLd]) }}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📍</span>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">
                Best Dentists in {cityName}, FL
              </h1>
              <p className="text-blue-100 text-lg">
                {finalList.length} {finalList.length === 1 ? 'practice' : 'practices'} found
              </p>
            </div>
          </div>
          <div className="space-y-3 max-w-3xl">
            <p className="text-blue-50 text-lg leading-relaxed">
              Discover trusted dentists in {cityName}, Florida. See who offers emergency care, kid-friendly visits,
              Invisalign, and accepts your insurance before you book.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#results"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Book / Request a visit →
              </Link>
              <Link
                href={`/fl/${city}/invisalign`}
                className="inline-flex items-center gap-2 border border-white/70 text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Compare Invisalign providers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" id="results">
        <Filters city={city} currentService={query.service} verifiedOnly={query.verifiedOnly} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {finalList.length === 0 ? (
            <div className="col-span-2">
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No dentists found</h3>
                <p className="text-slate-600">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            </div>
          ) : (
            finalList.map((dentist) => (
              <DentistCard
                key={dentist.id}
                dentist={dentist}
                city={city}
                isSponsored={dentist.isSponsored}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
