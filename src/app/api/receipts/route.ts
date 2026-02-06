import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";

export async function GET(request: NextRequest) {
  await dbConnect();
  const searchParams = request.nextUrl.searchParams;

  const filter: Record<string, unknown> = {};

  const search = searchParams.get("search");
  if (search) {
    filter.vendorName = { $regex: search, $options: "i" };
  }

  const category = searchParams.get("category");
  if (category) {
    filter.category = category;
  }

  const reportId = searchParams.get("reportId");
  if (reportId) {
    filter.reportId = reportId;
  }

  const unassigned = searchParams.get("unassigned");
  if (unassigned === "true") {
    filter.reportId = { $exists: false };
  }

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) (filter.date as Record<string, unknown>).$gte = new Date(dateFrom);
    if (dateTo) (filter.date as Record<string, unknown>).$lte = new Date(dateTo);
  }

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [receipts, total] = await Promise.all([
    Receipt.find(filter)
      .select("-fileData") // Don't send file data in list
      .populate("category")
      .populate("reportId")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Receipt.countDocuments(filter),
  ]);

  return NextResponse.json({ receipts, total, page, limit });
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  const receipt = await Receipt.create({
    vendorName: body.vendorName,
    date: new Date(body.date),
    lineItems: body.lineItems || [],
    subtotal: body.subtotal,
    tax: body.tax,
    total: body.total,
    originalCurrency: body.originalCurrency || "USD",
    convertedCurrency: body.convertedCurrency,
    convertedTotal: body.convertedTotal,
    exchangeRate: body.exchangeRate,
    category: body.category,
    notes: body.notes,
    fileName: body.fileName,
    fileType: body.fileType,
    fileData: Buffer.from(body.fileData, "base64"),
    reportId: body.reportId || undefined,
    aiExtracted: body.aiExtracted || false,
  });

  return NextResponse.json({ receipt: { ...receipt.toObject(), fileData: undefined } }, { status: 201 });
}
