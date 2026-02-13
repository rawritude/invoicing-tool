import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { handleCallback } from "@/lib/google-drive";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=no_code", request.url)
    );
  }

  try {
    await dbConnect();
    const tokens = await handleCallback(code);
    const settings = await getSettings();

    // Validate tokens before storing
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/settings?error=invalid_tokens", request.url)
      );
    }

    // Merge with existing tokens if refresh_token is missing
    settings.googleDriveTokens = {
      accessToken: tokens.access_token,
      refreshToken:
        tokens.refresh_token ||
        settings.googleDriveTokens?.refreshToken ||
        "",
      expiryDate: tokens.expiry_date || 0,
    };
    await settings.save();

    return NextResponse.redirect(
      new URL("/settings?drive=connected", request.url)
    );
  } catch (error) {
    console.error("Drive callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=auth_failed", request.url)
    );
  }
});
