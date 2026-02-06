import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Settings, { getSettings } from "@/lib/models/settings";
import { seedCategories } from "@/lib/seed";

export async function GET() {
  await dbConnect();
  await seedCategories();
  const settings = await getSettings();

  // Mask the API key for security
  const masked = settings.toObject();
  if (masked.geminiApiKey) {
    masked.geminiApiKey =
      masked.geminiApiKey.slice(0, 4) + "..." + masked.geminiApiKey.slice(-4);
  }
  // Don't expose drive tokens
  delete masked.googleDriveTokens;
  masked.googleDriveConnected = !!settings.googleDriveTokens?.refreshToken;

  return NextResponse.json({ settings: masked });
}

export async function PUT(request: Request) {
  await dbConnect();
  const body = await request.json();
  const settings = await getSettings();

  const allowedFields = [
    "geminiApiKey",
    "defaultCurrency",
    "invoiceNumberPrefix",
    "nextInvoiceNumber",
    "businessName",
    "businessAddress",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (settings as any)[field] = body[field];
    }
  }

  await settings.save();

  const masked = settings.toObject();
  if (masked.geminiApiKey) {
    masked.geminiApiKey =
      masked.geminiApiKey.slice(0, 4) + "..." + masked.geminiApiKey.slice(-4);
  }
  delete masked.googleDriveTokens;
  masked.googleDriveConnected = !!settings.googleDriveTokens?.refreshToken;

  return NextResponse.json({ settings: masked });
}
