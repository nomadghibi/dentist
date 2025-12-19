"use client";

import { useState } from "react";

interface LeadFormProps {
  dentistId: string;
  sourceUrl: string;
  onSuccess?: () => void;
}

export default function LeadForm({ dentistId, sourceUrl, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [followupError, setFollowupError] = useState<string | null>(null);
  const [engagementPrefs, setEngagementPrefs] = useState({
    reminderOptIn: true,
    reminderWindow: "24h" as "24h" | "72h" | "week-before" | "same-day",
    waitlistOptIn: false,
    preferredChannel: "email" as "email" | "sms",
    earliestDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setFollowupError(null);

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

      const payload = await response.json();
      const leadId: string | undefined = payload?.lead?.id;
      const followupChannel =
        engagementPrefs.preferredChannel === "sms" && !formData.patientPhone
          ? "email"
          : engagementPrefs.preferredChannel;
      const followupTasks: Array<Promise<Response>> = [];

      if (leadId && engagementPrefs.reminderOptIn) {
        followupTasks.push(
          fetch("/api/engagement/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId,
              reminderWindow: engagementPrefs.reminderWindow,
              channel: followupChannel,
              preferredTime: engagementPrefs.reminderWindow === "same-day" ? "morning" : undefined,
              note: formData.message || undefined,
            }),
          })
        );
      }

      if (leadId && engagementPrefs.waitlistOptIn) {
        followupTasks.push(
          fetch("/api/engagement/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId,
              channel: followupChannel,
              earliestDate: engagementPrefs.earliestDate || undefined,
              note: formData.message || undefined,
            }),
          })
        );
      }

      if (followupTasks.length > 0) {
        const results = await Promise.allSettled(followupTasks);
        const hasFailure = results.some(
          (result) => result.status === "rejected" || !result.value.ok
        );
        if (hasFailure) {
          setFollowupError(
            "We received your request but could not schedule every reminder. Our team will follow up."
          );
        }
      }

      setSubmitStatus("success");
      setFormData({ patientName: "", patientEmail: "", patientPhone: "", message: "" });
      setEngagementPrefs({
        reminderOptIn: true,
        reminderWindow: "24h",
        waitlistOptIn: false,
        preferredChannel: "email",
        earliestDate: "",
      });
      onSuccess?.();
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

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={engagementPrefs.reminderOptIn}
              onChange={(e) =>
                setEngagementPrefs((prev) => ({ ...prev, reminderOptIn: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Send me an appointment reminder
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-slate-500">Window</span>
            <select
              value={engagementPrefs.reminderWindow}
              onChange={(e) =>
                setEngagementPrefs((prev) => ({
                  ...prev,
                  reminderWindow: e.target.value as typeof prev.reminderWindow,
                }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!engagementPrefs.reminderOptIn}
            >
              <option value="24h">24 hours before</option>
              <option value="72h">72 hours before</option>
              <option value="week-before">One week before</option>
              <option value="same-day">Morning of appointment</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-800">Follow-up channel:</span>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="followup-channel"
              value="email"
              checked={engagementPrefs.preferredChannel === "email"}
              onChange={() =>
                setEngagementPrefs((prev) => ({ ...prev, preferredChannel: "email" }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            Email
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="followup-channel"
              value="sms"
              checked={engagementPrefs.preferredChannel === "sms"}
              onChange={() =>
                setEngagementPrefs((prev) => ({ ...prev, preferredChannel: "sms" }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            SMS / Text
          </label>
          {engagementPrefs.preferredChannel === "sms" && !formData.patientPhone && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Add a phone number to enable text reminders.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={engagementPrefs.waitlistOptIn}
              onChange={(e) =>
                setEngagementPrefs((prev) => ({ ...prev, waitlistOptIn: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Put me on the waitlist for earlier openings
          </label>
          <input
            type="text"
            value={engagementPrefs.earliestDate}
            onChange={(e) =>
              setEngagementPrefs((prev) => ({ ...prev, earliestDate: e.target.value }))
            }
            placeholder="Earliest date or timing preferences"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            disabled={!engagementPrefs.waitlistOptIn}
          />
        </div>
      </div>

      {submitStatus === "success" && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="text-xl">✓</span>
          <span>Thank you! Your request has been submitted successfully. We&apos;ll also follow up based on your reminder preferences.</span>
        </div>
      )}

      {followupError && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 text-amber-800 rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="text-xl">!</span>
          <span>{followupError}</span>
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
