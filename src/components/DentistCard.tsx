import Link from "next/link";
import type { Dentist } from "@/lib/ranking";

interface DentistCardProps {
  dentist: Dentist & { isSponsored?: boolean };
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
          </div>
          {dentist.verifiedStatus === "verified" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span>✓</span> Verified
            </span>
          )}
        </div>
      </div>

      {dentist.address && (
        <div className="flex items-start gap-2 mb-4 text-slate-600">
          <span className="text-slate-400">📍</span>
          <p className="text-sm">{dentist.address}</p>
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
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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
        <Link
          href={`/fl/${city}/dentists/${dentist.slug}`}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}

