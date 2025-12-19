import Link from "next/link";
import type { DentistWithMeta } from "@/lib/ranking";

interface DentistCardProps {
  dentist: DentistWithMeta & { isSponsored?: boolean };
  city: string;
  isSponsored?: boolean;
}

export default function DentistCard({ dentist, city, isSponsored }: DentistCardProps) {
  return (
    <div className={`group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200 card-hover ${
      isSponsored ? 'ring-2 ring-amber-200 bg-gradient-to-br from-white to-amber-50/30' : ''
    }`}>
      {isSponsored && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md">
            ⭐ Sponsored
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {dentist.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <Link
              href={`/fl/${city}/dentists/${dentist.slug}`}
              className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors group-hover:underline"
            >
              {dentist.name}
            </Link>
            {isSponsored && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                ⭐ Featured
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dentist.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                ⭐ {dentist.averageRating?.toFixed(1) ?? "5.0"}{" "}
                <span className="text-slate-500">
                  ({dentist.reviewCount} review{dentist.reviewCount === 1 ? "" : "s"})
                </span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">No reviews yet</span>
            )}
            {dentist.verifiedStatus === "verified" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <span>✓</span> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {(dentist.address || dentist.distanceMiles !== undefined) && (
        <div className="flex items-start gap-3 mb-4 text-slate-600">
          <span className="text-slate-400 mt-0.5">📍</span>
          <div className="text-sm space-y-1">
            {dentist.address && <p>{dentist.address}</p>}
            {dentist.distanceMiles !== undefined && (
              <p className="text-slate-500">
                {dentist.distanceMiles.toFixed(1)} miles away
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {dentist.servicesFlags?.emergency && (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
            🚨 Emergency
          </span>
        )}
        {dentist.servicesFlags?.pediatric && (
          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200">
            👶 Pediatric
          </span>
        )}
        {dentist.servicesFlags?.invisalign && (
          <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-lg border border-cyan-200">
            🦷 Invisalign
          </span>
        )}
        {dentist.acceptingNewPatients && (
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            ✅ Accepting new patients
          </span>
        )}
        {dentist.availabilityFlags?.same_week && (
          <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200">
            📅 Same-week
          </span>
        )}
        {dentist.availabilityFlags?.weekend && (
          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200">
            🗓️ Weekend
          </span>
        )}
        {dentist.availabilityFlags?.emergency_today && (
          <span className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200">
            ⚡ Emergency today
          </span>
        )}
      </div>

      {(dentist.badges?.license_verified || dentist.badges?.insurance_verified || dentist.badges?.pediatric_friendly) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {dentist.badges?.license_verified && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
              License verified
            </span>
          )}
          {dentist.badges?.insurance_verified && (
            <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">
              Insurance verified
            </span>
          )}
          {dentist.badges?.pediatric_friendly && (
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
              Pediatric friendly
            </span>
          )}
        </div>
      )}

      {dentist.insurances?.length ? (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Insurance</p>
          <div className="flex flex-wrap gap-2">
            {dentist.insurances.slice(0, 3).map((plan) => (
              <span
                key={plan}
                className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                {plan}
              </span>
            ))}
            {dentist.insurances.length > 3 && (
              <span className="px-2 py-1 text-xs text-slate-500">
                +{dentist.insurances.length - 3} more
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-3">
        <div className="text-sm">
          {dentist.phone && (
            <a 
              href={`tel:${dentist.phone}`} 
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2"
            >
              <span>📞</span> {dentist.phone}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/fl/${city}/dentists/${dentist.slug}#request`}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Book / Request
          </Link>
          <Link
            href={`/fl/${city}/dentists/${dentist.slug}`}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
