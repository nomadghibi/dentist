"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FiltersProps {
  city: string;
  currentService?: string;
  verifiedOnly?: boolean;
}

export default function Filters({ city, currentService, verifiedOnly }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const services = [
    { slug: "emergency-dentist", name: "Emergency" },
    { slug: "pediatric-dentist", name: "Pediatric" },
    { slug: "invisalign", name: "Invisalign" },
  ];

  const buildUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });
    const query = newParams.toString();
    return `/fl/${city}/dentists${query ? `?${query}` : ""}`;
  };

  return (
    <div className="glass-effect rounded-2xl p-6 mb-8 shadow-lg border border-slate-200/50">
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Filter by Service</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl({ service: null, verified: verifiedOnly ? "true" : null })}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                !currentService
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
              }`}
            >
              All Services
            </Link>
            {services.map((service) => (
              <Link
                key={service.slug}
                href={buildUrl({
                  service: service.slug,
                  verified: verifiedOnly ? "true" : null,
                })}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  currentService === service.slug
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
                }`}
              >
                {service.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Verification</label>
          <Link
            href={buildUrl({
              service: currentService || null,
              verified: verifiedOnly ? null : "true",
            })}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 inline-block ${
              verifiedOnly
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
            }`}
          >
            {verifiedOnly ? "✓ Verified Only" : "Show Verified Only"}
          </Link>
        </div>
      </div>
    </div>
  );
}

