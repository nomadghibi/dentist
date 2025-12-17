import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "For Dentists - Grow Your Practice | Dentist Finder",
  description: "Claim your profile, get featured placement, and generate more leads. Pricing, features, and everything you need to know.",
};

export default function ForDentistsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[800px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dentist21.png"
            alt="Dental practice growth"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/claim"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Claim Your Profile →
              </Link>
              <Link
                href="#pricing"
                className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-blue-700/70 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Claim Your Profile</h3>
              <p className="text-slate-600 mb-4">
                Find your existing listing or create a new one. Claim it with your email to take control.
              </p>
              <Link
                href="/claim"
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2"
              >
                Start Claiming →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 shadow-lg border border-emerald-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Get Verified</h3>
              <p className="text-slate-600 mb-4">
                Submit your Florida dental license. Our admin team will verify and add a "Verified" badge to your profile.
              </p>
              <p className="text-sm text-slate-500 italic">
                Verification is free and builds patient trust
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border border-purple-100">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Subscribe & Grow</h3>
              <p className="text-slate-600 mb-4">
                Choose a plan to get featured placement, lead generation tools, and analytics. Start attracting more patients.
              </p>
              <Link
                href="#pricing"
                className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-2"
              >
                See Plans →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for dental practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Featured Placement */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-4xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Featured Placement</h3>
              <p className="text-slate-600 mb-4">
                Get shown at the top of search results with a prominent "Sponsored" badge. Stand out from competitors and get more visibility.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Top search result positions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Premium visibility above organic results</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Increased click-through rates</span>
                </li>
              </ul>
            </div>

            {/* Lead Generation */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Lead Generation</h3>
              <p className="text-slate-600 mb-4">
                Receive patient inquiries directly through your profile. No more missed opportunities or third-party fees.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Direct patient contact information</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Lead management dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Real-time email notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Export leads to CSV</span>
                </li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
              <div className="relative w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-4xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Analytics & Insights</h3>
              <p className="text-slate-600 mb-4">
                Track your profile performance and understand what drives patient engagement. Make data-driven decisions.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Profile view statistics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Lead conversion tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Monthly performance reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>ROI measurement tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your practice. All plans include lead generation and analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-200 hover:shadow-xl transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-5xl font-extrabold text-slate-900">$99</span>
                  <span className="text-slate-600 ml-2">/month</span>
                </div>
                <p className="text-slate-600">Perfect for growing practices</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-slate-900">Featured Placement</strong>
                    <p className="text-sm text-slate-600">Top positions in search results</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-slate-900">Lead Generation</strong>
                    <p className="text-sm text-slate-600">Unlimited patient inquiries</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-slate-900">Basic Analytics</strong>
                    <p className="text-sm text-slate-600">Views, leads, and engagement metrics</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-slate-900">Profile Management</strong>
                    <p className="text-sm text-slate-600">Full control over your listing</p>
                  </div>
                </li>
              </ul>
              <Link
                href="/claim"
                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started with Pro
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl p-8 shadow-2xl border-4 border-blue-400 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-5xl font-extrabold">$199</span>
                  <span className="text-blue-100 ml-2">/month</span>
                </div>
                <p className="text-blue-100">Best value for established practices</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-amber-300 text-xl mt-1">✓</span>
                  <div>
                    <strong>Top Featured Placement</strong>
                    <p className="text-sm text-blue-100">Highest priority in search results</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-300 text-xl mt-1">✓</span>
                  <div>
                    <strong>All Pro Features</strong>
                    <p className="text-sm text-blue-100">Everything in Pro, plus more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-300 text-xl mt-1">✓</span>
                  <div>
                    <strong>Advanced Analytics</strong>
                    <p className="text-sm text-blue-100">Detailed reports and ROI tracking</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-300 text-xl mt-1">✓</span>
                  <div>
                    <strong>Priority Support</strong>
                    <p className="text-sm text-blue-100">Dedicated support team</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-300 text-xl mt-1">✓</span>
                  <div>
                    <strong>Enhanced Profile</strong>
                    <p className="text-sm text-blue-100">More photos, extended hours, special offers</p>
                  </div>
                </li>
              </ul>
              <Link
                href="/claim"
                className="block w-full text-center px-6 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started with Premium
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              All plans include a 30-day money-back guarantee. Cancel anytime.
            </p>
            <p className="text-sm text-slate-500">
              Questions? <Link href="/claim" className="text-blue-600 hover:underline">Contact us</Link> or <Link href="/claim" className="text-blue-600 hover:underline">claim your profile</Link> to get started.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Grow Your Practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of dentists already using Dentist Finder to attract more patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/claim"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 shadow-xl hover:scale-105 transition-all duration-200"
            >
              Claim Your Profile Now →
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-blue-700/70 transition-all duration-200"
            >
              View Pricing Details
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
