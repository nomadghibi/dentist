import { notFound } from "next/navigation";
import { db } from "@/db";
import { dentists } from "@/db/schema";
import { eq } from "drizzle-orm";
import VerifyButton from "@/components/VerifyButton";
import { requireAdminAuth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDentistPage({ params }: PageProps) {
  // Require admin authentication
  await requireAdminAuth();

  const { id } = await params;

  const [dentist] = await db.select().from(dentists).where(eq(dentists.id, id)).limit(1);

  if (!dentist) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{dentist.name}</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Verification Status</h2>
            <p className="text-gray-600 mb-4">
              Current status: <strong>{dentist.verifiedStatus}</strong>
            </p>
            <VerifyButton
              dentistId={dentist.id}
              currentStatus={dentist.verifiedStatus}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>NPI:</strong> {dentist.npi || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {dentist.address || "N/A"}
                </p>
                <p>
                  <strong>Phone:</strong> {dentist.phone || "N/A"}
                </p>
                <p>
                  <strong>Website:</strong> {dentist.website || "N/A"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>City:</strong> {dentist.cityName}
                </p>
                <p>
                  <strong>State:</strong> {dentist.state}
                </p>
                <p>
                  <strong>Slug:</strong> {dentist.slug}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

