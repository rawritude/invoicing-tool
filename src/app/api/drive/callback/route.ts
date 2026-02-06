import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { handleCallback } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", request.url));
  }

  try {
    await dbConnect();
    const tokens = await handleCallback(code);
    const settings = await getSettings();

    settings.googleDriveTokens = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date!,
    };
    await settings.save();

    return NextResponse.redirect(new URL("/settings?drive=connected", request.url));
  } catch (error) {
    console.error("Drive callback error:", error);
    return NextResponse.redirect(new URL("/settings?error=auth_failed", request.url));
  }
}
