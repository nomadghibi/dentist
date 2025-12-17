import { Metadata } from "next";
import MatchQuiz from "@/components/MatchQuiz";

export const metadata: Metadata = {
  title: "Find Your Perfect Dentist Match | Dentist Finder",
  description: "Answer a few questions to get personalized dentist recommendations in Palm Bay, Melbourne, and Space Coast, Florida.",
};

export default function MatchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Find Your Perfect Dentist Match
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Answer a few questions and we'll recommend the best dentists for your needs
          </p>
        </div>

        <MatchQuiz />
      </div>
    </div>
  );
}

