import { db } from "@/db";
import { dentists, adminAudit, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import ReviewModerationPanel from "@/components/ReviewModerationPanel";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Require admin authentication
  await requireAdminAuth();

  const unverifiedCount = await db
    .select({ count: dentists.id })
    .from(dentists)
    .where(eq(dentists.verifiedStatus, "unverified"));

  const recentAudits = await db
    .select()
    .from(adminAudit)
    .orderBy(desc(adminAudit.createdAt))
    .limit(10);

  const pendingReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      wouldRecommend: reviews.wouldRecommend,
      createdAt: reviews.createdAt,
      dentistName: dentists.name,
      cityName: dentists.cityName,
    })
    .from(reviews)
    .innerJoin(dentists, eq(reviews.dentistId, dentists.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt))
    .limit(8);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Unverified Dentists</h2>
            <p className="text-3xl font-bold text-blue-600">{unverifiedCount.length}</p>
            <Link href="/admin/dentists" className="text-sm text-blue-600 hover:underline mt-2">
              View All →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Audit Log</h2>
            <div className="space-y-2">
              {recentAudits.length === 0 ? (
                <p className="text-gray-600">No audit entries yet.</p>
              ) : (
                recentAudits.map((audit) => (
                  <div key={audit.id} className="border-b border-gray-200 pb-2 text-sm">
                    <span className="font-medium">{audit.action}</span> on {audit.entityType}{" "}
                    {audit.entityId} at {new Date(audit.createdAt).toLocaleString()}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pending Reviews</h2>
              <Link href="/admin/reviews" className="text-sm text-blue-600 hover:underline">
                View all →
              </Link>
            </div>
            <ReviewModerationPanel reviews={pendingReviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
