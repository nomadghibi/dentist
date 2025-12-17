import { NextRequest, NextResponse } from "next/server";
import { deleteToken } from "@/lib/auth";

const COOKIE_NAME = "dentist_session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  if (token) {
    deleteToken(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

