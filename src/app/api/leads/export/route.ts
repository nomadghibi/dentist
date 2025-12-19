import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dentists, leads, subscriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/\"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session || session.role !== "dentist") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [dentist] = await db
      .select()
      .from(dentists)
      .where(eq(dentists.userId, session.userId))
      .limit(1);

    if (!dentist) {
      return NextResponse.json({ error: "Dentist not found" }, { status: 404 });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dentistId, dentist.id))
      .limit(1);

    const entitlements = getEntitlements(subscription || null, dentist);
    if (!entitlements.canExportCSV) {
      return NextResponse.json(
        { error: "CSV export requires a Premium subscription" },
        { status: 403 }
      );
    }

    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.dentistId, dentist.id))
      .orderBy(desc(leads.createdAt))
      .limit(500);

    const headers = [
      "id",
      "patientName",
      "patientEmail",
      "patientPhone",
      "message",
      "status",
      "leadScore",
      "contactedAt",
      "bookedAt",
      "createdAt",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.patientName,
          row.patientEmail,
          row.patientPhone || "",
          row.message || "",
          row.status,
          row.leadScore ?? "",
          row.contactedAt?.toISOString() || "",
          row.bookedAt?.toISOString() || "",
          row.createdAt.toISOString(),
        ]
          .map(escapeCsvValue)
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=leads.csv",
      },
    });
  } catch (error) {
    console.error("Error exporting leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
