import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - Dentist Finder",
  description: "Choose a subscription plan to get featured placement and lead generation tools.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Pricing</h1>
        <p className="text-gray-600 text-center mb-12">
          Choose a plan to get featured placement and access to lead generation tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-4">Pro</h2>
            <p className="text-3xl font-bold mb-4">$99<span className="text-lg">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Featured placement in search results
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Lead generation tools
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Basic analytics
              </li>
            </ul>
            <Link
              href="/for-dentists"
              className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 border-2 border-blue-600">
            <h2 className="text-2xl font-bold mb-4">Premium</h2>
            <p className="text-3xl font-bold mb-4">$199<span className="text-lg">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Top featured placement
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                All Pro features
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Advanced analytics
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Priority support
              </li>
            </ul>
            <Link
              href="/for-dentists"
              className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

