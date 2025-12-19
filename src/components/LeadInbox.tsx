"use client";

import { useEffect, useMemo, useState } from "react";

type LeadStatus = "new" | "contacted" | "booked" | "lost";

interface LeadNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

interface Lead {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  message: string | null;
  status: LeadStatus;
  leadScore: number | null;
  createdAt: string;
  contactedAt: string | null;
  bookedAt: string | null;
  notes: LeadNote[] | null;
}

interface LeadInboxProps {
  initialLeads?: Lead[];
  dentistName: string;
  userEmail: string;
  canExportCSV: boolean;
}

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  lost: "Lost",
};

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-800",
  booked: "bg-emerald-100 text-emerald-800",
  lost: "bg-rose-100 text-rose-800",
};

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Unexpected error occurred";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function responseTimeHours(createdAt: string, contactedAt: string | null) {
  if (!contactedAt) return null;
  const diffMs = new Date(contactedAt).getTime() - new Date(createdAt).getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

export default function LeadInbox({
  initialLeads = [],
  dentistName,
  userEmail,
  canExportCSV,
}: LeadInboxProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(initialLeads.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (initialLeads.length > 0) return;
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/leads?limit=100");
        if (!res.ok) {
          throw new Error("Failed to load leads");
        }
        const data = await res.json();
        setLeads(data.leads);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [initialLeads]);

  const statusCounts = useMemo(() => {
    return leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      { new: 0, contacted: 0, booked: 0, lost: 0 } as Record<LeadStatus, number>
    );
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (filterStatus === "all") return leads;
    return leads.filter((lead) => lead.status === filterStatus);
  }, [leads, filterStatus]);

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setSavingLeadId(leadId);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status }),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      const data = await res.json();
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? data.lead : lead)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleAddNote = async (leadId: string) => {
    const draft = noteDrafts[leadId];
    if (!draft) return;
    setSavingLeadId(leadId);
    setWebhookMessage(null);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          note: { body: draft, author: dentistName || userEmail },
        }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const data = await res.json();
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? data.lead : lead)));
      setNoteDrafts((prev) => ({ ...prev, [leadId]: "" }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/export");
      if (!res.ok) throw new Error("CSV export is unavailable");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const handleSendWebhook = async (leadId: string) => {
    if (!webhookUrl) {
      setWebhookMessage("Enter a webhook URL to send a payload");
      return;
    }

    setSavingLeadId(leadId);
    setWebhookMessage(null);
    try {
      const res = await fetch("/api/leads/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, leadId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Webhook failed");
      }
      setWebhookMessage("Webhook delivered to CRM/Zapier");
    } catch (err: unknown) {
      setWebhookMessage(getErrorMessage(err));
    } finally {
      setSavingLeadId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Lead Inbox</h3>
          <p className="text-sm text-slate-600">
            Track lead statuses, add notes, export CSVs, and send to your CRM/Zapier hooks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "all")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All leads</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="booked">Booked</option>
            <option value="lost">Lost</option>
          </select>
          {canExportCSV && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              disabled={exporting}
            >
              {exporting ? "Preparing CSV..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-slate-200">
        {Object.entries(statusLabels).map(([status, label]) => (
          <span
            key={status}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status as LeadStatus]}`}
          >
            {label}: {statusCounts[status as LeadStatus] || 0}
          </span>
        ))}
        {webhookMessage && <span className="text-sm text-slate-600">{webhookMessage}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-2/3">
          <label className="text-sm font-medium text-slate-700">CRM/Zapier Webhook URL</label>
          <input
            type="url"
            placeholder="https://hooks.zapier.com/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <p className="text-sm text-slate-500">
          Send any lead below to your webhook with one click.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {loading ? (
          <div className="p-6 text-slate-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-6 text-slate-500">No leads match this filter.</div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-lg font-semibold text-slate-900">{lead.patientName}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[lead.status]}`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                    {lead.leadScore !== null && (
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                        Score {lead.leadScore}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{lead.patientEmail}</p>
                  {lead.patientPhone && <p className="text-sm text-slate-700">{lead.patientPhone}</p>}
                  {lead.message && <p className="text-sm text-slate-600 italic">“{lead.message}”</p>}
                  <p className="text-xs text-slate-500">
                    Received {formatDate(lead.createdAt)}
                    {lead.contactedAt && ` · Contacted in ${responseTimeHours(lead.createdAt, lead.contactedAt)}h`}
                    {lead.bookedAt && " · Booked"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(lead.id, "contacted")}
                    className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
                    disabled={savingLeadId === lead.id}
                  >
                    Mark contacted
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead.id, "booked")}
                    className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50"
                    disabled={savingLeadId === lead.id}
                  >
                    Mark booked
                  </button>
                  <button
                    onClick={() => handleStatusChange(lead.id, "lost")}
                    className="px-4 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-50"
                    disabled={savingLeadId === lead.id}
                  >
                    Mark lost
                  </button>
                  <button
                    onClick={() => handleSendWebhook(lead.id)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                    disabled={savingLeadId === lead.id}
                  >
                    Send to webhook
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Notes</label>
                  <div className="space-y-2 mt-2">
                    {(lead.notes || []).length === 0 && (
                      <p className="text-sm text-slate-500">No notes yet.</p>
                    )}
                    {(lead.notes || []).map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>{note.author || "Team"}</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                        <p>{note.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Add note</label>
                  <textarea
                    rows={3}
                    value={noteDrafts[lead.id] || ""}
                    onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Call notes, insurance details, next steps..."
                  />
                  <button
                    onClick={() => handleAddNote(lead.id)}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    disabled={!noteDrafts[lead.id] || savingLeadId === lead.id}
                  >
                    Save note
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
