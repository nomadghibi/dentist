"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface FiltersProps {
  city: string;
  currentService?: string;
  verifiedOnly?: boolean;
  currentInsurance?: string;
  availability?: {
    acceptingNewPatients?: boolean;
    sameWeek?: boolean;
    weekend?: boolean;
    emergencyToday?: boolean;
  };
  radiusMiles?: number;
}

export default function Filters({
  city,
  currentService,
  verifiedOnly,
  currentInsurance,
  availability,
  radiusMiles,
}: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const services = [
    { slug: "emergency-dentist", name: "Emergency" },
    { slug: "pediatric-dentist", name: "Pediatric" },
    { slug: "invisalign", name: "Invisalign" },
  ];

  const insurancePlans = [
    "Delta Dental",
    "MetLife",
    "Cigna",
    "Aetna",
    "Guardian",
    "UnitedHealthcare",
  ];

  const radiusOptions = [5, 10, 15, 25, 50];

  const buildUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams();
    const existing = searchParams;

    // Start with existing params so we preserve known filters
    existing.forEach((value, key) => {
      if (!(key in params)) {
        newParams.set(key, value);
      }
    });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    const query = newParams.toString();
    return `/fl/${city}/dentists${query ? `?${query}` : ""}`;
  };

  const toggleAvailability = (flag: keyof NonNullable<FiltersProps["availability"]>) => {
    const next = {
      acceptingNewPatients:
        flag === "acceptingNewPatients"
          ? !availability?.acceptingNewPatients
          : availability?.acceptingNewPatients,
      sameWeek: flag === "sameWeek" ? !availability?.sameWeek : availability?.sameWeek,
      weekend: flag === "weekend" ? !availability?.weekend : availability?.weekend,
      emergencyToday:
        flag === "emergencyToday"
          ? !availability?.emergencyToday
          : availability?.emergencyToday,
    };

    router.push(
      buildUrl({
        service: currentService || null,
        verified: verifiedOnly ? "true" : null,
        insurance: currentInsurance || null,
        acceptingNewPatients: next.acceptingNewPatients ? "true" : null,
        sameWeek: next.sameWeek ? "true" : null,
        weekend: next.weekend ? "true" : null,
        emergencyToday: next.emergencyToday ? "true" : null,
        radius: radiusMiles ? String(radiusMiles) : null,
      })
    );
  };

  return (
    <div className="glass-effect rounded-2xl p-6 mb-8 shadow-lg border border-slate-200/50">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-slate-700 mb-3 block">Filter by Service</label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl({
                service: null,
                verified: verifiedOnly ? "true" : null,
                insurance: currentInsurance || null,
                radius: radiusMiles ? String(radiusMiles) : null,
                acceptingNewPatients: availability?.acceptingNewPatients ? "true" : null,
                sameWeek: availability?.sameWeek ? "true" : null,
                weekend: availability?.weekend ? "true" : null,
                emergencyToday: availability?.emergencyToday ? "true" : null,
              })}
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
                  insurance: currentInsurance || null,
                  radius: radiusMiles ? String(radiusMiles) : null,
                  acceptingNewPatients: availability?.acceptingNewPatients ? "true" : null,
                  sameWeek: availability?.sameWeek ? "true" : null,
                  weekend: availability?.weekend ? "true" : null,
                  emergencyToday: availability?.emergencyToday ? "true" : null,
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Insurance</label>
          <select
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white shadow-inner"
            value={currentInsurance || ""}
            onChange={(e) => {
              const value = e.target.value || null;
              router.push(
                buildUrl({
                  service: currentService || null,
                  verified: verifiedOnly ? "true" : null,
                  insurance: value,
                  radius: radiusMiles ? String(radiusMiles) : null,
                  acceptingNewPatients: availability?.acceptingNewPatients ? "true" : null,
                  sameWeek: availability?.sameWeek ? "true" : null,
                  weekend: availability?.weekend ? "true" : null,
                  emergencyToday: availability?.emergencyToday ? "true" : null,
                })
              );
            }}
          >
            <option value="">Any insurance</option>
            {insurancePlans.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Within</label>
          <select
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white shadow-inner"
            value={radiusMiles?.toString() ?? ""}
            onChange={(e) => {
              const value = e.target.value ? e.target.value : null;
              router.push(
                buildUrl({
                  service: currentService || null,
                  verified: verifiedOnly ? "true" : null,
                  insurance: currentInsurance || null,
                  radius: value,
                  acceptingNewPatients: availability?.acceptingNewPatients ? "true" : null,
                  sameWeek: availability?.sameWeek ? "true" : null,
                  weekend: availability?.weekend ? "true" : null,
                  emergencyToday: availability?.emergencyToday ? "true" : null,
                })
              );
            }}
          >
            <option value="">Any distance</option>
            {radiusOptions.map((radius) => (
              <option key={radius} value={radius}>
                {radius} miles
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={() => toggleAvailability("acceptingNewPatients")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            availability?.acceptingNewPatients
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          {availability?.acceptingNewPatients ? "✓ Accepting new patients" : "Accepting new patients"}
        </button>
        <button
          type="button"
          onClick={() => toggleAvailability("sameWeek")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            availability?.sameWeek
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          {availability?.sameWeek ? "✓ Same-week appts" : "Same-week appointments"}
        </button>
        <button
          type="button"
          onClick={() => toggleAvailability("weekend")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            availability?.weekend
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          {availability?.weekend ? "✓ Weekend availability" : "Weekend availability"}
        </button>
        <button
          type="button"
          onClick={() => toggleAvailability("emergencyToday")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            availability?.emergencyToday
              ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105"
          }`}
        >
          {availability?.emergencyToday ? "✓ Emergency today" : "Emergency today"}
        </button>

        <Link
          href={buildUrl({
            service: null,
            verified: null,
            insurance: null,
            radius: null,
            acceptingNewPatients: null,
            sameWeek: null,
            weekend: null,
            emergencyToday: null,
          })}
          className="ml-auto px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Reset filters
        </Link>
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold text-slate-700 mb-3 block">Verification</label>
        <Link
          href={buildUrl({
            service: currentService || null,
            verified: verifiedOnly ? null : "true",
            insurance: currentInsurance || null,
            radius: radiusMiles ? String(radiusMiles) : null,
            acceptingNewPatients: availability?.acceptingNewPatients ? "true" : null,
            sameWeek: availability?.sameWeek ? "true" : null,
            weekend: availability?.weekend ? "true" : null,
            emergencyToday: availability?.emergencyToday ? "true" : null,
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
  );
}
