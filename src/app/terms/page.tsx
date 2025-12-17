import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Dentist Finder",
  description: "Terms of service for Dentist Finder platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 prose max-w-none">
          <p className="text-gray-600">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="mt-4 text-gray-700">
            By using Dentist Finder, you agree to these terms of service.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using this platform, you accept and agree to be bound by these terms.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">Use of Service</h2>
          <p className="text-gray-700">
            You agree to use the service only for lawful purposes and in accordance with these
            terms.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
          <p className="text-gray-700">
            For questions about these terms, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}

