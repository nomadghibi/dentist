import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists, reviews, subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { buildDentistProfileMetadata, buildDentistJsonLd, buildCanonical } from "@/lib/seo";
import { validateCitySlug } from "@/lib/slug";
import ProfileViewTracker from "@/components/ProfileViewTracker";
import ClickTracker from "@/components/ClickTracker";
import PracticeDetails from "@/components/PracticeDetails";
import LeadRequestPanel from "@/components/LeadRequestPanel";
import Link from "next/link";

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

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.dentistId, dentist.id))
    .limit(1);

  const approvedReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.dentistId, dentist.id), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  const isFeatured =
    !!subscription &&
    subscription.status === "active" &&
    (subscription.plan === "pro" || subscription.plan === "premium");

  const jsonLd = buildDentistJsonLd(dentist);
  const breadcrumbJsonLd = {
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
        name: `${dentist.cityName} Dentists`,
        item: buildCanonical(`/fl/${city}/dentists`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: dentist.name,
        item: buildCanonical(`/fl/${city}/dentists/${slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProfileViewTracker dentistId={dentist.id} />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                    Dentist in {dentist.cityName}, FL
                  </p>
                  {dentist.verifiedStatus === "verified" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                  {isFeatured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{dentist.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  {dentist.reviewCount > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ⭐ {dentist.averageRating?.toFixed(1) ?? "5.0"}
                      </span>
                      <span className="text-sm text-slate-600">
                        {dentist.reviewCount} review{dentist.reviewCount === 1 ? "" : "s"}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">No patient reviews yet</span>
                  )}
                </div>
                {dentist.address && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span>📍</span> {dentist.address}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {dentist.servicesFlags?.emergency && (
                    <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
                      Emergency ready
                    </span>
                  )}
                  {dentist.availabilityFlags?.same_week && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                      Same-week openings
                    </span>
                  )}
                  {dentist.acceptingNewPatients && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                      Accepting new patients
                    </span>
                  )}
                  {dentist.badges?.license_verified && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                      License verified
                    </span>
                  )}
                  {dentist.badges?.insurance_verified && (
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">
                      Insurance verified
                    </span>
                  )}
                  {dentist.badges?.pediatric_friendly && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                      Pediatric friendly
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {dentist.phone && (
                  <ClickTracker
                    dentistId={dentist.id}
                    eventType="call_click"
                    href={`tel:${dentist.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    📞 Call clinic
                  </ClickTracker>
                )}
                <Link
                  href="#request"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Book / Request
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Patient reviews & ratings</h2>
              {approvedReviews.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No public reviews yet. Once patients submit feedback, approved reviews will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            ⭐ {review.rating.toFixed(1)}
                          </span>
                          {review.wouldRecommend !== null && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {review.wouldRecommend ? "Would recommend" : "Would not recommend"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(review.createdAt as Date).toLocaleDateString()}
                        </p>
                      </div>
                      {review.title && <p className="font-semibold text-slate-900">{review.title}</p>}
                      {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
                <div className="space-y-2 text-sm">
                  {dentist.phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Phone:</span>{" "}
                      <ClickTracker
                        dentistId={dentist.id}
                        eventType="call_click"
                        href={`tel:${dentist.phone}`}
                        className="text-blue-600 hover:underline font-semibold"
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
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Visit Website
                      </ClickTracker>
                    </p>
                  )}
                  {dentist.languages && dentist.languages.length > 0 && (
                    <p className="text-gray-600">
                      <span className="font-medium">Languages:</span> {dentist.languages.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Why patients book here</h2>
                <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                  <li>Direct requests sent to the practice with your preferred time.</li>
                  <li>Insurance, availability, and hours shared up front.</li>
                  <li>No phone tag—staff can text or email you back.</li>
                </ul>
                <Link
                  href="#request"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Request appointment →
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <PracticeDetails
                hours={dentist.hours}
                insurances={dentist.insurances}
                servicesFlags={dentist.servicesFlags}
                pricingRanges={dentist.pricingRanges}
                availabilityFlags={dentist.availabilityFlags}
              />
            </div>
          </div>

          <LeadRequestPanel dentistId={dentist.id} sourceUrl={`/fl/${city}/dentists/${slug}`} />
        </div>
      </div>
    </>
  );
}
