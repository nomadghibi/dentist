import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, createToken, AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session token
    const token = createToken(user.id, user.email, user.role);

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      role: user.role
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

