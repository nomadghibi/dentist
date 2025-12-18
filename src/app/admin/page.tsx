import { redirect } from "next/navigation";
import { db } from "@/db";
import { dentists, adminAudit } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// TODO: Add proper auth check

export default async function AdminDashboardPage() {
  // TODO: Check admin session
  // For now, this is a placeholder

  const unverifiedCount = await db
    .select({ count: dentists.id })
    .from(dentists)
    .where(eq(dentists.verifiedStatus, "unverified"));

  const recentAudits = await db
    .select()
    .from(adminAudit)
    .orderBy(desc(adminAudit.createdAt))
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Unverified Dentists</h2>
            <p className="text-3xl font-bold text-blue-600">{unverifiedCount.length}</p>
            <Link href="/admin/dentists" className="text-sm text-blue-600 hover:underline mt-2">
              View All →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Audit Log</h2>
          <div className="space-y-2">
            {recentAudits.length === 0 ? (
              <p className="text-gray-600">No audit entries yet.</p>
            ) : (
              recentAudits.map((audit) => (
                <div key={audit.id} className="border-b border-gray-200 pb-2 text-sm">
                  <span className="font-medium">{audit.action}</span> on {audit.entityType}{" "}
                  {audit.entityId} at {new Date(audit.createdAt).toLocaleString()}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

