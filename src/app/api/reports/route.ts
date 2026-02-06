import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Report from "@/lib/models/report";
import Receipt from "@/lib/models/receipt";

export async function GET() {
  await dbConnect();
  const reports = await Report.find().sort({ createdAt: -1 });

  // Get receipt counts and totals for each report
  const reportsWithStats = await Promise.all(
    reports.map(async (report) => {
      const receipts = await Receipt.find({ reportId: report._id }).select("total originalCurrency");
      const totalAmount = receipts.reduce((sum, r) => sum + r.total, 0);
      return {
        ...report.toObject(),
        receiptCount: receipts.length,
        totalAmount,
      };
    })
  );

  return NextResponse.json({ reports: reportsWithStats });
}

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  const report = await Report.create({
    name: body.name,
    description: body.description,
    status: "draft",
    dateFrom: body.dateFrom ? new Date(body.dateFrom) : undefined,
    dateTo: body.dateTo ? new Date(body.dateTo) : undefined,
  });
  return NextResponse.json({ report }, { status: 201 });
}
