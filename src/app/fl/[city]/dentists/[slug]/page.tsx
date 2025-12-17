import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { buildDentistProfileMetadata, buildDentistJsonLd } from "@/lib/seo";
import { validateCitySlug } from "@/lib/slug";
import LeadForm from "@/components/LeadForm";
import ProfileViewTracker from "@/components/ProfileViewTracker";
import ClickTracker from "@/components/ClickTracker";

interface PageProps {
  params: Promise<{ city: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, slug } = await params;
  if (!validateCitySlug(city)) {
    return {};
  }

  const [dentist] = await db
    .select()
    .from(dentists)
    .where(and(eq(dentists.citySlug, city), eq(dentists.slug, slug)))
    .limit(1);

  if (!dentist) {
    return {};
  }

  return buildDentistProfileMetadata(dentist.name, dentist.cityName, city, slug);
}

export default async function DentistProfilePage({ params }: PageProps) {
  const { city, slug } = await params;

  if (!validateCitySlug(city)) {
    notFound();
  }

  const [dentist] = await db
    .select()
    .from(dentists)
    .where(and(eq(dentists.citySlug, city), eq(dentists.slug, slug)))
    .limit(1);

  if (!dentist) {
    notFound();
  }

  const jsonLd = buildDentistJsonLd(dentist);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileViewTracker dentistId={dentist.id} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{dentist.name}</h1>
                {dentist.verifiedStatus === "verified" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
                <div className="space-y-2 text-sm">
                  {dentist.address && (
                    <p className="text-gray-600">
                      <span className="font-medium">Address:</span> {dentist.address}
                    </p>
                  )}
                  {dentist.phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span>{" "}
                      <ClickTracker
                        dentistId={dentist.id}
                        eventType="call_click"
                        href={`tel:${dentist.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {dentist.phone}
                      </ClickTracker>
                    </p>
                  )}
                  {dentist.website && (
                    <p className="text-gray-600">
                      <span className="font-medium">Website:</span>{" "}
                      <ClickTracker
                        dentistId={dentist.id}
                        eventType="website_click"
                        href={dentist.website}
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </ClickTracker>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {dentist.servicesFlags?.emergency && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Emergency
                    </span>
                  )}
                  {dentist.servicesFlags?.pediatric && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Pediatric
                    </span>
                  )}
                  {dentist.servicesFlags?.invisalign && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Invisalign
                    </span>
                  )}
                </div>

                {dentist.insurances && dentist.insurances.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Insurance Accepted</h3>
                    <div className="flex flex-wrap gap-2">
                      {dentist.insurances.map((insurance) => (
                        <span
                          key={insurance}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {insurance}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dentist.languages && dentist.languages.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Languages</h3>
                    <p className="text-sm text-gray-600">{dentist.languages.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>

            {dentist.hours && Object.keys(dentist.hours).length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-3">Hours</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(dentist.hours).map(([day, hours]) => (
                    <div key={day}>
                      <span className="font-medium capitalize">{day}:</span>{" "}
                      {hours ? `${hours.open} - ${hours.close}` : "Closed"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Request an Appointment</h2>
            <LeadForm dentistId={dentist.id} sourceUrl={`/fl/${city}/dentists/${slug}`} />
          </div>
        </div>
      </div>
    </>
  );
}

