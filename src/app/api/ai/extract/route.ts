import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { extractReceiptData } from "@/lib/gemini";

export async function POST(request: Request) {
  await dbConnect();
  const settings = await getSettings();

  if (!settings.geminiApiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Go to Settings to add it." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { fileData, mimeType } = body;

  if (!fileData || !mimeType) {
    return NextResponse.json(
      { error: "Missing fileData or mimeType" },
      { status: 400 }
    );
  }

  try {
    const extracted = await extractReceiptData(fileData, mimeType, settings.geminiApiKey);
    return NextResponse.json(extracted);
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI extraction failed" },
      { status: 500 }
    );
  }
}
