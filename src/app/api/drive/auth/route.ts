import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-drive";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Drive auth error:", error);
    return NextResponse.json(
      {
        error:
          "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
      },
      { status: 500 }
    );
  }
});
