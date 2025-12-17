import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Dentist Finder",
  description: "Privacy policy for Dentist Finder platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 prose max-w-none">
          <p className="text-gray-600">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="mt-4 text-gray-700">
            This privacy policy describes how Dentist Finder collects, uses, and protects your
            information.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
          <p className="text-gray-700">
            We collect information you provide directly, such as when you submit a lead form or
            claim a profile.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
          <p className="text-gray-700">
            We use your information to provide our services, process leads, and improve our
            platform.
          </p>
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
          <p className="text-gray-700">
            For questions about this privacy policy, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}

