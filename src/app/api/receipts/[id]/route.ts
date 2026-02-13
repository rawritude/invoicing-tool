import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";
import { apiHandler } from "@/lib/api-handler";

const ALLOWED_UPDATE_FIELDS = [
  "vendorName",
  "date",
  "lineItems",
  "subtotal",
  "tax",
  "total",
  "originalCurrency",
  "convertedCurrency",
  "convertedTotal",
  "exchangeRate",
  "category",
  "notes",
  "reportId",
];

export const GET = apiHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await dbConnect();
    const { id } = await params;
    const receipt = await Receipt.findById(id)
      .populate("category")
      .populate("reportId");
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const obj = receipt.toObject();
    if (obj.fileData) {
      obj.fileData = Buffer.from(obj.fileData).toString("base64");
    }

    return NextResponse.json({ receipt: obj });
  }
);

export const PUT = apiHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed fields
    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    if (update.date) {
      update.date = new Date(update.date as string);
    }

    const receipt = await Receipt.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate("category")
      .populate("reportId");

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({
      receipt: { ...receipt.toObject(), fileData: undefined },
    });
  }
);

export const DELETE = apiHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await dbConnect();
    const { id } = await params;
    const receipt = await Receipt.findByIdAndDelete(id);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }
);
