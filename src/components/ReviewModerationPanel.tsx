"use client";

import { useState } from "react";

interface ReviewSummary {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  wouldRecommend: boolean | null;
  createdAt: string | Date;
  dentistName: string;
  cityName: string;
}

interface Props {
  reviews: ReviewSummary[];
}

export default function ReviewModerationPanel({ reviews }: Props) {
  const [items, setItems] = useState(reviews);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const moderateReview = async (id: string, status: "approved" | "rejected") => {
    setLoadingId(id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update review");
      }

      setItems((prev) => prev.filter((r) => r.id !== id));
      setStatusMessage(`Review ${status === "approved" ? "approved" : "rejected"} successfully.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update review");
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-gray-600 text-sm">No pending reviews right now.</p>;
  }

  return (
    <div className="space-y-3">
      {statusMessage && (
        <div className="p-3 rounded-md text-sm bg-slate-50 text-slate-700 border border-slate-200">
          {statusMessage}
        </div>
      )}
      {items.map((review) => (
        <div
          key={review.id}
          className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2 bg-slate-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {review.dentistName} <span className="text-slate-500">({review.cityName})</span>
              </p>
              <p className="text-xs text-slate-500">
                {new Date(review.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                ⭐ {review.rating.toFixed(1)}
              </span>
              {review.wouldRecommend !== null && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {review.wouldRecommend ? "Would recommend" : "Would not recommend"}
                </span>
              )}
            </div>
          </div>
          {review.title && <p className="font-semibold text-slate-900">{review.title}</p>}
          {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => moderateReview(review.id, "approved")}
              disabled={loadingId === review.id}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loadingId === review.id ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() => moderateReview(review.id, "rejected")}
              disabled={loadingId === review.id}
              className="px-3 py-1.5 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {loadingId === review.id ? "Saving..." : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
