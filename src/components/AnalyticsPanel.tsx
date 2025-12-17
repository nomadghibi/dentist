"use client";

interface AnalyticsData {
  last7Days: {
    views: number;
    leads: number;
    conversionRate: number;
    avgLeadScore: number;
    callClicks: number;
    websiteClicks: number;
    matchImpressions: number;
  };
  last30Days: {
    views: number;
    leads: number;
    conversionRate: number;
    avgLeadScore: number;
    callClicks: number;
    websiteClicks: number;
    matchImpressions: number;
  };
}

interface AnalyticsPanelProps {
  data: AnalyticsData;
  canViewAdvanced: boolean;
}

export default function AnalyticsPanel({ data, canViewAdvanced }: AnalyticsPanelProps) {
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

