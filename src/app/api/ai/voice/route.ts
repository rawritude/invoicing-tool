import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { interpretVoiceInput } from "@/lib/gemini";

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
  const { audio, mimeType, currentFields } = body;

  if (!audio || !mimeType) {
    return NextResponse.json(
      { error: "Missing audio or mimeType" },
      { status: 400 }
    );
  }

  try {
    const updatedFields = await interpretVoiceInput(
      audio,
      mimeType,
      currentFields || {},
      settings.geminiApiKey
    );
    return NextResponse.json({ updatedFields });
  } catch (error) {
    console.error("Voice interpretation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice interpretation failed" },
      { status: 500 }
    );
  }
}
