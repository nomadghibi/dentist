"use client";

import type { AnalyticsResult } from "@/lib/analytics";

interface AnalyticsPanelProps {
  data: AnalyticsResult;
  canViewAdvanced: boolean;
}

const statusStyles: Record<string, string> = {
  new: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-800",
  booked: "bg-emerald-100 text-emerald-800",
  lost: "bg-rose-100 text-rose-800",
};

export default function AnalyticsPanel({ data, canViewAdvanced }: AnalyticsPanelProps) {
  const pipeline = data.leadPipeline;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Profile Views (7d)</p>
          <p className="text-3xl font-bold text-slate-900">{data.last7Days.views}</p>
          <p className="text-xs text-slate-500 mt-1">
            {data.last30Days.views} in last 30 days
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Leads (7d)</p>
          <p className="text-3xl font-bold text-blue-600">{data.last7Days.leads}</p>
          <p className="text-xs text-slate-500 mt-1">
            {data.last30Days.leads} in last 30 days
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold text-emerald-600">
            {data.last7Days.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.last30Days.conversionRate.toFixed(1)}% (30d)
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Avg Lead Score</p>
          <p className="text-3xl font-bold text-purple-600">
            {data.last7Days.avgLeadScore.toFixed(0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {data.last30Days.avgLeadScore.toFixed(0)} (30d)
          </p>
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lead Pipeline (30d)</h3>
            <p className="text-sm text-slate-600">
              Volume, response times, and status mix for the past month
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(pipeline.statusBreakdown).map(([status, count]) => (
              <span
                key={status}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
              >
                {status} · {count}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-1">Average response</p>
            <p className="text-3xl font-bold text-slate-900">
              {pipeline.avgResponseHours !== null ? `${pipeline.avgResponseHours}h` : "N/A"}
            </p>
            <p className="text-xs text-slate-500">Time from lead to first contact</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-1">Contact rate</p>
            <p className="text-3xl font-bold text-blue-700">{pipeline.contactedRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Contacted + booked / total</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-1">Booked conversion</p>
            <p className="text-3xl font-bold text-emerald-700">{pipeline.bookedRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Booked / total</p>
          </div>
        </div>
      </div>

      {/* Advanced Metrics (Premium only) */}
      {canViewAdvanced && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Engagement Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Phone Clicks (7d)</p>
              <p className="text-2xl font-bold text-slate-900">{data.last7Days.callClicks}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Website Clicks (7d)</p>
              <p className="text-2xl font-bold text-slate-900">{data.last7Days.websiteClicks}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Match Impressions (7d)</p>
              <p className="text-2xl font-bold text-slate-900">
                {data.last7Days.matchImpressions}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
