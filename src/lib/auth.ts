import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "10");
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

export async function createUser(email: string, password: string, role: "admin" | "dentist" = "dentist") {
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role,
    })
    .returning();
  return user;
}

// Simple session management using database-stored sessions
export interface Session {
  userId: string;
  email: string;
  role: "admin" | "dentist";
}

const COOKIE_NAME = "dentist_session";

// In-memory session store (for development)
// In production, use database sessions table
interface SessionStore {
  [token: string]: {
    userId: string;
    email: string;
    role: "admin" | "dentist";
    expiresAt: number;
  };
}

const sessionStore: SessionStore = {};

/**
 * Create a session token for a user
 */
export function createToken(userId: string, email: string, role: "admin" | "dentist"): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  sessionStore[token] = {
    userId,
    email,
    role,
    expiresAt,
  };

  // Clean up expired sessions periodically
  if (Object.keys(sessionStore).length > 1000) {
    const now = Date.now();
    Object.keys(sessionStore).forEach((key) => {
      if (sessionStore[key].expiresAt < now) {
        delete sessionStore[key];
      }
    });
  }

  return token;
}

/**
 * Verify a session token
 */
export function verifyToken(token: string): Session | null {
  const session = sessionStore[token];
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    delete sessionStore[token];
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
  };
}

/**
 * Delete a session token
 */
export function deleteToken(token: string): void {
  delete sessionStore[token];
}

/**
 * Get session from request (checks cookies)
 */
export async function getServerSession(request?: Request): Promise<Session | null> {
  try {
    // Try to get from Next.js cookies (for server components)
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      return verifyToken(token);
    }

    // Fallback: try to get from request headers (for API routes)
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        return verifyToken(token);
      }

      // Also check cookies from request
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => c.split("="))
        );
        const token = cookies[COOKIE_NAME];
        if (token) {
          return verifyToken(token);
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string): void {
  // This will be called from API routes using NextResponse
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): void {
  // This will be called from logout API route
}

