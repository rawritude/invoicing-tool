import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";

export async function GET() {
  await dbConnect();
  const settings = await getSettings();
  const connected = !!settings.googleDriveTokens?.refreshToken;
  return NextResponse.json({ connected });
}
