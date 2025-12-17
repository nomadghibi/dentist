"use client";

import { useState } from "react";

interface AvailabilityFormProps {
  initialData?: {
    acceptingNewPatients: boolean | null;
    availabilityFlags?: {
      same_week?: boolean;
      emergency_today?: boolean;
      weekend?: boolean;
    };
  };
  onSuccess?: () => void;
}

export default function AvailabilityForm({ initialData, onSuccess }: AvailabilityFormProps) {
  const [loading, setLoading] = useState(false);
  const [acceptingNew, setAcceptingNew] = useState<boolean | null>(
    initialData?.acceptingNewPatients ?? null
  );
  const [flags, setFlags] = useState({
    same_week: initialData?.availabilityFlags?.same_week ?? false,
    emergency_today: initialData?.availabilityFlags?.emergency_today ?? false,
    weekend: initialData?.availabilityFlags?.weekend ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/dentist/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptingNewPatients: acceptingNew,
          availabilityFlags: flags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      alert("Availability updated successfully!");
      onSuccess?.();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Update Availability</h3>

      <div className="space-y-4">
        {/* Accepting New Patients */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Are you accepting new patients?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="accepting"
                checked={acceptingNew === true}
                onChange={() => setAcceptingNew(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="accepting"
                checked={acceptingNew === false}
                onChange={() => setAcceptingNew(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span>No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="accepting"
                checked={acceptingNew === null}
                onChange={() => setAcceptingNew(null)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Not specified</span>
            </label>
          </div>
        </div>

        {/* Availability Flags */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Availability Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flags.same_week}
                onChange={(e) => setFlags({ ...flags, same_week: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <span>Can schedule same-week appointments</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flags.emergency_today}
                onChange={(e) => setFlags({ ...flags, emergency_today: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <span>Available for emergency appointments today</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flags.weekend}
                onChange={(e) => setFlags({ ...flags, weekend: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <span>Available on weekends</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </form>
  );
}

