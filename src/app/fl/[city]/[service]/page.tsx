import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists, subscriptions } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { buildServicePageMetadata } from "@/lib/seo";
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

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="mt-8 space-y-4">
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

