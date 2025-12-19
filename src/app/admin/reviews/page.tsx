import { db } from "@/db";
import { dentists, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import ReviewModerationPanel from "@/components/ReviewModerationPanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
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
    .limit(25);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
          </div>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Pending reviews</h2>
            <p className="text-sm text-slate-500">{pendingReviews.length} awaiting review</p>
          </div>
          <ReviewModerationPanel reviews={pendingReviews} />
        </div>
      </div>
    </div>
  );
}
