import { db } from "@/db";
import { users } from "@/db/schema";
import { getServerSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { InferSelectModel } from "drizzle-orm";

export type AdminUser = InferSelectModel<typeof users> & { role: "admin" };

function isAdmin(user: InferSelectModel<typeof users> | null | undefined): user is AdminUser {
  return !!user && user.role === "admin";
}

export async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  const session = await getServerSession(request);

  if (!session || session.role !== "admin") return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!isAdmin(user)) return null;

  return user;
}
