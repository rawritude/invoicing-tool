import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Report from "@/lib/models/report";
import Receipt from "@/lib/models/receipt";
import { apiHandler } from "@/lib/api-handler";

const ALLOWED_UPDATE_FIELDS = ["name", "description", "status", "dateFrom", "dateTo"];

export const GET = apiHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await dbConnect();
    const { id } = await params;
    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const receipts = await Receipt.find({ reportId: id })
      .select("-fileData")
      .populate("category")
      .sort({ date: -1 });

    return NextResponse.json({ report, receipts });
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

    if (update.dateFrom) update.dateFrom = new Date(update.dateFrom as string);
    if (update.dateTo) update.dateTo = new Date(update.dateTo as string);

    const report = await Report.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  }
);

export const DELETE = apiHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    await dbConnect();
    const { id } = await params;

    // Unassign receipts from this report
    await Receipt.updateMany({ reportId: id }, { $unset: { reportId: 1 } });

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }
);
