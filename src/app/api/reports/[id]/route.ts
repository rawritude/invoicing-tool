import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Report from "@/lib/models/report";
import Receipt from "@/lib/models/receipt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  if (body.dateFrom) body.dateFrom = new Date(body.dateFrom);
  if (body.dateTo) body.dateTo = new Date(body.dateTo);

  const report = await Report.findByIdAndUpdate(id, body, { new: true });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
