import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/models/settings";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  await dbConnect();
  const settings = await getSettings();

  const masked = settings.toObject();
  // Better API key masking: show only last 4 chars
  if (masked.geminiApiKey) {
    masked.geminiApiKey =
      masked.geminiApiKey.length > 4
        ? "••••" + masked.geminiApiKey.slice(-4)
        : "••••";
  }
  // Don't expose drive tokens
  delete masked.googleDriveTokens;
  masked.googleDriveConnected = !!settings.googleDriveTokens?.refreshToken;

  return NextResponse.json({ settings: masked });
});

export const PUT = apiHandler(async (request: Request) => {
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
      masked.geminiApiKey.length > 4
        ? "••••" + masked.geminiApiKey.slice(-4)
        : "••••";
  }
  delete masked.googleDriveTokens;
  masked.googleDriveConnected = !!settings.googleDriveTokens?.refreshToken;

  return NextResponse.json({ settings: masked });
});
