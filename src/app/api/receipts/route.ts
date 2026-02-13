import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";
import { apiHandler } from "@/lib/api-handler";
import {
  escapeRegex,
  isValidObjectId,
  isValidDate,
  clampPagination,
  MAX_FILE_SIZE,
} from "@/lib/validate";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export const GET = apiHandler(async (request: NextRequest) => {
  await dbConnect();
  const searchParams = request.nextUrl.searchParams;

  const filter: Record<string, unknown> = {};

  const search = searchParams.get("search");
  if (search) {
    filter.vendorName = { $regex: escapeRegex(search), $options: "i" };
  }

  const category = searchParams.get("category");
  if (category) {
    if (!isValidObjectId(category)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    filter.category = category;
  }

  const reportId = searchParams.get("reportId");
  if (reportId) {
    if (!isValidObjectId(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }
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
    if (dateFrom) {
      if (!isValidDate(dateFrom)) {
        return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
      }
      (filter.date as Record<string, unknown>).$gte = new Date(dateFrom);
    }
    if (dateTo) {
      if (!isValidDate(dateTo)) {
        return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
      }
      (filter.date as Record<string, unknown>).$lte = new Date(dateTo);
    }
  }

  const { page, limit, skip } = clampPagination(
    searchParams.get("page"),
    searchParams.get("limit")
  );

  const [receipts, total] = await Promise.all([
    Receipt.find(filter)
      .select("-fileData")
      .populate("category")
      .populate("reportId")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Receipt.countDocuments(filter),
  ]);

  return NextResponse.json({ receipts, total, page, limit });
});

export const POST = apiHandler(async (request: NextRequest) => {
  await dbConnect();
  const body = await request.json();

  if (!body.vendorName || typeof body.vendorName !== "string") {
    return NextResponse.json({ error: "vendorName is required" }, { status: 400 });
  }
  if (body.total == null || typeof body.total !== "number") {
    return NextResponse.json({ error: "total is required" }, { status: 400 });
  }
  if (!body.date || !isValidDate(body.date)) {
    return NextResponse.json({ error: "Valid date is required" }, { status: 400 });
  }
  if (!body.fileData || typeof body.fileData !== "string") {
    return NextResponse.json({ error: "fileData is required" }, { status: 400 });
  }
  if (body.fileData.length > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }
  if (!body.fileName || !body.fileType) {
    return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(body.fileType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

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

  return NextResponse.json(
    { receipt: { ...receipt.toObject(), fileData: undefined } },
    { status: 201 }
  );
});
