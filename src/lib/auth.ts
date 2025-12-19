import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto, { timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "dentist_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type UserRole = "admin" | "dentist";

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

export async function createUser(email: string, password: string, role: UserRole = "dentist") {
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

// Session management using HMAC-signed tokens stored in httpOnly cookies
export interface Session {
  userId: string;
  email: string;
  role: UserRole;
}

interface SessionPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number; // seconds since epoch
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): SessionPayload {
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
}

function sign(encodedPayload: string): string {
  return crypto.createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");
}

/**
 * Create an HMAC-signed session token
 */
export function createToken(userId: string, email: string, role: UserRole): string {
  const payload: SessionPayload = {
    sub: userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = encodePayload(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verify a session token
 */
export function verifyToken(token: string): Session | null {
  try {
    const [encoded, signature] = token.split(".");

    if (!encoded || !signature) {
      return null;
    }

    const expectedSignature = sign(encoded);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    const payload = decodePayload(encoded);

    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    console.error("Failed to verify token", error);
    return null;
  }
}

/**
 * Get session from request (checks cookies first, then Authorization header)
 */
export async function getServerSession(request?: Request): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      const session = verifyToken(token);
      if (session) return session;
    }

    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const bearerToken = authHeader.substring(7);
        const session = verifyToken(bearerToken);
        if (session) return session;
      }

      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const parsedCookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => c.split("="))
        );
        const headerToken = parsedCookies[AUTH_COOKIE_NAME];
        if (headerToken) {
          const session = verifyToken(headerToken);
          if (session) return session;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting server session", error);
    return null;
  }
}

/**
 * Delete a session token (stateless tokens are revoked by clearing the cookie)
 */
export function deleteToken(): void {
  // Stateless token – clearing the cookie removes access
}
