import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAuthUrl, handleOAuthCallback } from "@/lib/calendar/google-calendar";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (code) {
      const user = await requireUser();
      await handleOAuthCallback(code, user.id);
      return NextResponse.redirect(new URL("/calendar?connected=true", req.url));
    }

    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Calendar auth error:", error);
    return NextResponse.redirect(new URL("/calendar?error=auth_failed", req.url));
  }
}
