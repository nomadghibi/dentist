"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MatchQuizAnswers } from "@/lib/validators/match";

interface Recommendation {
  dentist: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    citySlug: string;
  };
  score: number;
  reasons: Array<{ code: string; message: string }>;
}

export default function MatchQuiz() {
  const router = useRouter();
  const [step, setStep] = useState<"quiz" | "results">("quiz");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [answers, setAnswers] = useState<Partial<MatchQuizAnswers>>({
    city: "palm-bay",
    urgency: "flexible",
    adult_or_child: "adult",
    anxiety_level: "none",
    weekend_need: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setStep("results");
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "results") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Top Matches</h2>
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <div
              key={rec.dentist.id}
              className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900">{rec.dentist.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {rec.score}% Match
                    </span>
                  </div>
                  {rec.dentist.address && (
                    <p className="text-slate-600 text-sm mb-2">{rec.dentist.address}</p>
                  )}
                  {rec.dentist.phone && (
                    <p className="text-slate-600 text-sm">{rec.dentist.phone}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Why this match:</p>
                <ul className="space-y-1">
                  {rec.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-emerald-600 mt-1">✓</span>
                      <span>{reason.message}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/fl/${rec.dentist.citySlug}/dentists/${rec.dentist.slug}`}
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                View Profile →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => {
              setStep("quiz");
              setRecommendations([]);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
      <div className="space-y-6">
        {/* City Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Which city are you looking in? <span className="text-red-500">*</span>
          </label>
          <select
            value={answers.city}
            onChange={(e) => setAnswers({ ...answers, city: e.target.value as any })}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="palm-bay">Palm Bay</option>
            <option value="melbourne">Melbourne</option>
            <option value="space-coast">Space Coast</option>
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            How urgent is your need? <span className="text-red-500">*</span>
          </label>
          <select
            value={answers.urgency}
            onChange={(e) => setAnswers({ ...answers, urgency: e.target.value as any })}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="emergency">Emergency (need today)</option>
            <option value="same-week">Same week</option>
            <option value="flexible">Flexible timing</option>
            <option value="routine">Routine checkup</option>
          </select>
        </div>

        {/* Adult or Child */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Who needs the appointment? <span className="text-red-500">*</span>
          </label>
          <select
            value={answers.adult_or_child}
            onChange={(e) => setAnswers({ ...answers, adult_or_child: e.target.value as any })}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="adult">Adult</option>
            <option value="child">Child</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Anxiety Level */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Anxiety level about dental visits <span className="text-red-500">*</span>
          </label>
          <select
            value={answers.anxiety_level}
            onChange={(e) => setAnswers({ ...answers, anxiety_level: e.target.value as any })}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No anxiety</option>
            <option value="low">Low anxiety</option>
            <option value="moderate">Moderate anxiety</option>
            <option value="high">High anxiety</option>
          </select>
        </div>

        {/* Weekend Need */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={answers.weekend_need}
              onChange={(e) => setAnswers({ ...answers, weekend_need: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-700">
              I need weekend appointments
            </span>
          </label>
        </div>

        {/* Insurance (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Insurance provider (optional)
          </label>
          <input
            type="text"
            value={answers.insurance || ""}
            onChange={(e) => setAnswers({ ...answers, insurance: e.target.value })}
            placeholder="e.g., Blue Cross, Delta Dental"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Language (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Preferred language (optional)
          </label>
          <input
            type="text"
            value={answers.language || ""}
            onChange={(e) => setAnswers({ ...answers, language: e.target.value })}
            placeholder="e.g., Spanish, French"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Budget Sensitivity (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            How important is cost? (optional)
          </label>
          <select
            value={answers.budget_sensitivity || ""}
            onChange={(e) => setAnswers({ ...answers, budget_sensitivity: e.target.value as any })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Not important</option>
            <option value="not-important">Not important</option>
            <option value="somewhat">Somewhat important</option>
            <option value="very-important">Very important</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Finding Your Matches..." : "Find My Matches →"}
        </button>
      </div>
    </form>
  );
}

