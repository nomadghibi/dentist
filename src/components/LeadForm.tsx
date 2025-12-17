"use client";

import { useState } from "react";

interface LeadFormProps {
  dentistId: string;
  sourceUrl: string;
}

export default function LeadForm({ dentistId, sourceUrl }: LeadFormProps) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dentistId,
          sourceUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitStatus("success");
      setFormData({ patientName: "", patientEmail: "", patientPhone: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="patientName" className="block text-sm font-semibold text-slate-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="patientName"
          required
          value={formData.patientName}
          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="patientEmail" className="block text-sm font-semibold text-slate-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="patientEmail"
          required
          value={formData.patientEmail}
          onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label htmlFor="patientPhone" className="block text-sm font-semibold text-slate-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="patientPhone"
          value={formData.patientPhone}
          onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
          Message (Optional)
        </label>
        <textarea
          id="message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          placeholder="Tell us about your dental needs..."
        />
      </div>

      {submitStatus === "success" && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="text-xl">✓</span>
          <span>Thank you! Your request has been submitted successfully.</span>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="text-xl">⚠</span>
          <span>Something went wrong. Please try again.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Submitting...
          </span>
        ) : (
          "Request Appointment →"
        )}
      </button>
    </form>
  );
}

