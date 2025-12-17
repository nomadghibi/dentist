"use client";

interface Lead {
  id: string;
  patientName: string;
  patientEmail: string;
  leadScore: number | null;
  status: "new" | "contacted" | "booked" | "lost";
  createdAt: string;
}

interface LeadListProps {
  leads: Lead[];
  canViewScores: boolean;
}

export default function LeadList({ leads, canViewScores }: LeadListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-emerald-100 text-emerald-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-slate-500";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">Recent Leads</h3>
        <p className="text-sm text-slate-600 mt-1">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} in the last 30 days
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {leads.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No leads yet</div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900">{lead.patientName}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                    {canViewScores && lead.leadScore !== null && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(
                          lead.leadScore
                        )} bg-slate-100`}
                      >
                        Score: {lead.leadScore}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{lead.patientEmail}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${lead.patientEmail}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

