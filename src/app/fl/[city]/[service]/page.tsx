import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { buildServicePageMetadata, buildCanonical } from "@/lib/seo";
import { validateCitySlug, validateServiceSlug } from "@/lib/slug";
import { sortDentists, injectFeatured, type RankingQuery } from "@/lib/ranking";
import DentistCard from "@/components/DentistCard";
import Link from "next/link";

const CITY_NAMES: Record<string, string> = {
  "palm-bay": "Palm Bay",
  "melbourne": "Melbourne",
  "space-coast": "Space Coast",
};

const SERVICE_NAMES: Record<string, string> = {
  "emergency-dentist": "Emergency Dentist",
  "pediatric-dentist": "Pediatric Dentist",
  "invisalign": "Invisalign",
};

interface PageProps {
  params: Promise<{ city: string; service: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, service } = await params;
  if (!validateCitySlug(city) || !validateServiceSlug(service)) {
    return {};
  }
  const cityName = CITY_NAMES[city] || city;
  const serviceName = SERVICE_NAMES[service] || service;
  return buildServicePageMetadata(cityName, city, serviceName, service);
}

export default async function ServicePage({ params, searchParams }: PageProps) {
  const { city, service } = await params;

  if (!validateCitySlug(city) || !validateServiceSlug(service)) {
    notFound();
  }

  const cityName = CITY_NAMES[city] || city;
  const serviceName = SERVICE_NAMES[service] || service;

  const serviceMap: Record<string, string> = {
    "emergency-dentist": "emergency",
    "pediatric-dentist": "pediatric",
    "invisalign": "invisalign",
  };
  const serviceKey = serviceMap[service];

  // Fetch dentists with this service
  let cityDentists = await db
    .select()
    .from(dentists)
    .where(eq(dentists.citySlug, city));

  // Filter by service
  cityDentists = cityDentists.filter((d) => {
    return d.servicesFlags?.[serviceKey as keyof typeof d.servicesFlags] === true;
  });

  const query: RankingQuery = { service };
  const sorted = sortDentists(cityDentists, query);

  // Fetch featured dentists - select all fields to match Dentist type
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
    .then((results) =>
      results
        .map((r) => r.dentists) // Extract dentists from join result
        .filter((d) => {
          return d.servicesFlags?.[serviceKey as keyof typeof d.servicesFlags] === true;
        })
    );

  const finalList = injectFeatured(sorted, featuredDentists, {
    maxFeatured: 5,
    positions: [1, 3, 6, 10, 15],
  });

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${serviceName} in ${cityName}, FL`,
    description: `Top-rated ${serviceName.toLowerCase()} providers in ${cityName}, Florida.`,
    url: buildCanonical(`/fl/${city}/${service}`),
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
      {
        "@type": "ListItem",
        position: 3,
        name: serviceName,
        item: buildCanonical(`/fl/${city}/${service}`),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([listJsonLd, breadcrumbsJsonLd]) }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-600 mb-4">
          <Link href={`/fl/${city}/dentists`} className="hover:text-gray-900">
            {cityName} Dentists
          </Link>
          <span className="mx-2">/</span>
          <span>{serviceName}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {serviceName} in {cityName}, FL
        </h1>
        <p className="text-gray-600 mb-8">
          Find the best {serviceName.toLowerCase()} services in {cityName}, Florida. Compare verified practices and book appointments.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 mb-10">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Why patients choose us</h2>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Only practices serving {cityName} with the exact service you searched.</li>
              <li>Insurance, availability, and emergency flags surfaced before you call.</li>
              <li>Fast “Book / Request” buttons send your info directly to the office.</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-xl p-4 shadow-lg">
            <p className="text-xs uppercase tracking-wide font-semibold">Need this week?</p>
            <p className="text-lg font-bold">Tell us your timeframe and we&apos;ll alert matching dentists.</p>
            <Link
              href="#service-results"
              className="mt-3 inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Request availability →
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4" id="service-results">
          {finalList.length === 0 ? (
            <p className="text-gray-600">No {serviceName.toLowerCase()} providers found in {cityName}.</p>
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
