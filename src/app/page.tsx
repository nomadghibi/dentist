import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { sql } from "drizzle-orm";
import { buildCanonical, buildFaqJsonLd, buildLocalBusinessJsonLd } from "@/lib/seo";

export const dynamic = 'force-dynamic';

async function getCityDentistCounts() {
  const counts = await db
    .select({
      citySlug: dentists.citySlug,
      count: sql<number>`count(*)::int`,
    })
    .from(dentists)
    .groupBy(dentists.citySlug);

  return counts.reduce((acc, item) => {
    acc[item.citySlug] = item.count;
    return acc;
  }, {} as Record<string, number>);
}

export default async function HomePage() {
  const cityCounts = await getCityDentistCounts();

  const businessJsonLd = buildLocalBusinessJsonLd({
    name: "Dentist Finder",
    description: "Verified directory of dentists serving Palm Bay, Melbourne, and the Space Coast.",
    url: buildCanonical("/"),
    serviceArea: "Florida",
    priceRange: "$$",
  });

  const faqJsonLd = buildFaqJsonLd([
    {
      question: "How does Dentist Finder vet dental practices?",
      answer:
        "We verify Florida licensing, highlight verified practices, and surface availability, insurance, and emergency readiness so you can book with confidence.",
    },
    {
      question: "Can I request an appointment online?",
      answer:
        "Yes. Submit a request from any dentist profile and we notify the practice with your preferred contact details.",
    },
    {
      question: "Which cities are covered?",
      answer: "Palm Bay, Melbourne, and the Space Coast with more Florida markets coming soon.",
    },
  ]);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([businessJsonLd, faqJsonLd]) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[800px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dentist2.png"
            alt="Dental care - Find the best dentists"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-transparent"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="max-w-3xl">
            <div className="text-white">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
                Find the Best Dentists in
                <span className="block text-cyan-200">Palm Bay, Melbourne & Space Coast</span>
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 mb-8 drop-shadow-md">
                Compare top-rated dentists near you and book your appointment today!
              </p>
              <div className="mb-6">
                <Link
                  href="/match"
                  className="inline-block px-8 py-4 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  🎯 Find Your Perfect Match (New!)
                </Link>
              </div>
              
              {/* Search Box */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xl">🔍</span>
                    <input
                      type="text"
                      placeholder="Search for a dentist or service"
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-500"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xl">📍</span>
                    <input
                      type="text"
                      placeholder="Palm Bay, Melbourne or Space Coast"
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-500"
                      readOnly
                    />
                  </div>
                  <a
                    href="#find-dentists"
                    className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-center"
                  >
                    Search
                  </a>
                </div>
              </div>

              {/* Feature Icons */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <p className="text-sm font-semibold text-white">Licensed Professionals</p>
                  <p className="text-xs text-blue-200">Verified & Trusted</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-white text-xl">$</span>
                  </div>
                  <p className="text-sm font-semibold text-white">Compare Costs</p>
                  <p className="text-xs text-blue-200">Affordable Options</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-white text-xl">📅</span>
                  </div>
                  <p className="text-sm font-semibold text-white">Book Easily</p>
                  <p className="text-xs text-blue-200">Same-day Appointments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Matching Quiz CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Not Sure Which Dentist is Right for You?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Answer a few questions and we'll match you with the perfect dentist
          </p>
          <Link
            href="/match"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Take the Matching Quiz →
          </Link>
        </div>
      </section>

      {/* Patient Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Why Patients Choose Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to find the perfect dentist for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Verified Practices */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified & Licensed</h3>
              <p className="text-slate-600">
                All dentists are verified and licensed in Florida. We check credentials so you don't have to.
              </p>
            </div>

            {/* Card 2: Easy Search */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Easy Search & Filter</h3>
              <p className="text-slate-600">
                Find dentists by service type, insurance accepted, location, and more. Get exactly what you need.
              </p>
            </div>

            {/* Card 3: Direct Booking */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Request Appointments</h3>
              <p className="text-slate-600">
                Contact dentists directly through their profiles. No third-party booking fees or hassles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section id="find-dentists" className="py-20 bg-white scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Find Dentists by City
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore verified dental practices in Florida's top cities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              href="/fl/palm-bay/dentists"
              className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl card-hover border border-slate-200"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="relative w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🏖️</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Palm Bay
                </h3>
                <p className="text-slate-600 mb-4">
                  {cityCounts["palm-bay"] || 0} verified dentists in Palm Bay, FL
                </p>
                <span className="text-blue-600 font-semibold group-hover:translate-x-2 inline-block transition-transform">
                  Explore →
                </span>
              </div>
            </Link>

            <Link
              href="/fl/melbourne/dentists"
              className="group relative overflow-hidden bg-gradient-to-br from-white to-cyan-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl card-hover border border-slate-200"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="relative w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🌴</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">
                  Melbourne
                </h3>
                <p className="text-slate-600 mb-4">
                  {cityCounts["melbourne"] || 0} verified dentists in Melbourne, FL
                </p>
                <span className="text-cyan-600 font-semibold group-hover:translate-x-2 inline-block transition-transform">
                  Explore →
                </span>
              </div>
            </Link>

            <Link
              href="/fl/space-coast/dentists"
              className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl card-hover border border-slate-200"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="relative w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Space Coast
                </h3>
                <p className="text-slate-600 mb-4">
                  {cityCounts["space-coast"] || 0} verified dentists in Space Coast, FL
                </p>
                <span className="text-purple-600 font-semibold group-hover:translate-x-2 inline-block transition-transform">
                  Explore →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-extrabold mb-2">60+</div>
              <div className="text-blue-100 text-lg">Verified Dentists</div>
            </div>
            <div>
              <div className="text-5xl font-extrabold mb-2">3</div>
              <div className="text-blue-100 text-lg">Florida Cities</div>
            </div>
            <div>
              <div className="text-5xl font-extrabold mb-2">24/7</div>
              <div className="text-blue-100 text-lg">Search Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
