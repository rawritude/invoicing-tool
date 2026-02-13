import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  await dbConnect();
  const settings = await getSettings();
  const connected = !!settings.googleDriveTokens?.refreshToken;
  return NextResponse.json({ connected });
});
