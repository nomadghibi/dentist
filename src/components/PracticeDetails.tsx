interface PracticeDetailsProps {
  hours?: Record<string, { open: string; close: string } | null> | null;
  insurances?: string[] | null;
  servicesFlags?: Record<string, boolean | undefined> | null;
  pricingRanges?: Record<string, { min: number; max: number } | undefined> | null;
  availabilityFlags?: Record<string, boolean | undefined> | null;
}

const SERVICE_LABELS: Record<string, string> = {
  emergency: "Emergency visits",
  pediatric: "Pediatric dentistry",
  invisalign: "Invisalign & clear aligners",
};

const PRICING_LABELS: Record<string, string> = {
  cleaning: "Cleaning & exam",
  emergency_visit: "Emergency visit",
  crown: "Crown",
  invisalign: "Invisalign",
  implants: "Implants",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  same_week: "Can see you this week",
  emergency_today: "Emergency slots today",
  weekend: "Weekend availability",
};

function formatHours(hours?: PracticeDetailsProps["hours"]) {
  if (!hours || Object.keys(hours).length === 0) return null;

  return Object.entries(hours).map(([day, window]) => ({
    day,
    label: `${day.charAt(0).toUpperCase()}${day.slice(1)}`,
    value: window ? `${window.open} - ${window.close}` : "Closed",
  }));
}

function formatPricing(pricingRanges?: PracticeDetailsProps["pricingRanges"]) {
  if (!pricingRanges) return [];
  return Object.entries(pricingRanges)
    .filter(([, range]) => range && range.min !== undefined && range.max !== undefined)
    .map(([key, range]) => ({
      key,
      label: PRICING_LABELS[key] || key,
      value: `$${range!.min.toLocaleString()} - $${range!.max.toLocaleString()}`,
    }));
}

export default function PracticeDetails({
  hours,
  insurances,
  servicesFlags,
  pricingRanges,
  availabilityFlags,
}: PracticeDetailsProps) {
  const hoursList = formatHours(hours);
  const pricingList = formatPricing(pricingRanges);

  const activeServices = Object.entries(servicesFlags || {}).filter(([, enabled]) => enabled);
  const activeAvailability = Object.entries(availabilityFlags || {}).filter(([, enabled]) => enabled);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Office hours</h3>
        {hoursList ? (
          <dl className="space-y-2 text-sm text-slate-700">
            {hoursList.map((entry) => (
              <div key={entry.day} className="flex items-center justify-between">
                <dt className="capitalize text-slate-600">{entry.label}</dt>
                <dd className="font-medium">{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Hours not yet provided.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Insurance & services</h3>
        <div className="space-y-3">
          {insurances && insurances.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Insurance accepted</p>
              <div className="flex flex-wrap gap-2">
                {insurances.map((insurance) => (
                  <span
                    key={insurance}
                    className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-100"
                  >
                    {insurance}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Insurance details coming soon.</p>
          )}

          {activeServices.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Services</p>
              <div className="flex flex-wrap gap-2">
                {activeServices.map(([key]) => (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100"
                  >
                    {SERVICE_LABELS[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeAvailability.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Availability</p>
              <div className="flex flex-wrap gap-2">
                {activeAvailability.map(([key]) => (
                  <span
                    key={key}
                    className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-100"
                  >
                    {AVAILABILITY_LABELS[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Pricing guidance</h3>
        {pricingList.length > 0 ? (
          <dl className="space-y-2 text-sm text-slate-700">
            {pricingList.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between">
                <dt className="text-slate-600">{entry.label}</dt>
                <dd className="font-medium">{entry.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Pricing ranges not published yet.</p>
        )}
      </div>
    </div>
  );
}
