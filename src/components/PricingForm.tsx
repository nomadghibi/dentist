"use client";

import { useState } from "react";

interface PricingRanges {
  cleaning?: { min: number; max: number };
  emergency_visit?: { min: number; max: number };
  crown?: { min: number; max: number };
  invisalign?: { min: number; max: number };
  implants?: { min: number; max: number };
}

interface PricingFormProps {
  initialData?: PricingRanges;
  onSuccess?: () => void;
}

export default function PricingForm({ initialData, onSuccess }: PricingFormProps) {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingRanges>(initialData || {});

  const updatePrice = (service: keyof PricingRanges, field: "min" | "max", value: number) => {
    setPricing({
      ...pricing,
      [service]: {
        ...pricing[service],
        [field]: value,
      } as { min: number; max: number },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/dentist/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricingRanges: pricing }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      alert("Pricing updated successfully!");
      onSuccess?.();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Update Pricing Ranges</h3>
      <p className="text-sm text-slate-600 mb-6">
        Provide estimated price ranges to help patients understand costs. These are optional and
        will display with a disclaimer.
      </p>

      <div className="space-y-6">
        {/* Cleaning */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Teeth Cleaning
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={pricing.cleaning?.min || ""}
                onChange={(e) =>
                  updatePrice("cleaning", "min", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={pricing.cleaning?.max || ""}
                onChange={(e) =>
                  updatePrice("cleaning", "max", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">$</span>
          </div>
        </div>

        {/* Emergency Visit */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Emergency Visit
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={pricing.emergency_visit?.min || ""}
                onChange={(e) =>
                  updatePrice("emergency_visit", "min", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={pricing.emergency_visit?.max || ""}
                onChange={(e) =>
                  updatePrice("emergency_visit", "max", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">$</span>
          </div>
        </div>

        {/* Crown */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Crown</label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={pricing.crown?.min || ""}
                onChange={(e) => updatePrice("crown", "min", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={pricing.crown?.max || ""}
                onChange={(e) => updatePrice("crown", "max", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">$</span>
          </div>
        </div>

        {/* Invisalign */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Invisalign</label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={pricing.invisalign?.min || ""}
                onChange={(e) =>
                  updatePrice("invisalign", "min", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={pricing.invisalign?.max || ""}
                onChange={(e) =>
                  updatePrice("invisalign", "max", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">$</span>
          </div>
        </div>

        {/* Implants */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Implants</label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={pricing.implants?.min || ""}
                onChange={(e) =>
                  updatePrice("implants", "min", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">to</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={pricing.implants?.max || ""}
                onChange={(e) =>
                  updatePrice("implants", "max", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-slate-600">$</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Pricing"}
          </button>
        </div>
      </div>
    </form>
  );
}

