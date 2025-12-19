"use client";

import { useState } from "react";
import LeadForm from "./LeadForm";

interface LeadRequestPanelProps {
  dentistId: string;
  sourceUrl: string;
}

export default function LeadRequestPanel({ dentistId, sourceUrl }: LeadRequestPanelProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" id="request">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">
            Request an appointment
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            Tell us how to reach you
          </h2>
          <p className="text-sm text-slate-600">
            We send your request straight to the practice. No payment required.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            <span className="text-base mr-1">✓</span> Secure & HIPAA-friendly
          </span>
          {submitted && (
            <p className="mt-2 text-xs text-emerald-700 font-semibold">
              Request received! We&apos;ll notify the office.
            </p>
          )}
        </div>
      </div>

      <LeadForm
        dentistId={dentistId}
        sourceUrl={sourceUrl}
        onSuccess={() => setSubmitted(true)}
      />
    </div>
  );
}
