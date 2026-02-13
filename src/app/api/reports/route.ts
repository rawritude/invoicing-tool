import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Report from "@/lib/models/report";
import Receipt from "@/lib/models/receipt";
import { apiHandler } from "@/lib/api-handler";
import { isValidDate } from "@/lib/validate";

export const GET = apiHandler(async () => {
  await dbConnect();
  const reports = await Report.find().sort({ createdAt: -1 });

  // Use aggregation instead of N+1 queries
  const stats = await Receipt.aggregate([
    { $match: { reportId: { $exists: true } } },
    {
      $group: {
        _id: "$reportId",
        receiptCount: { $sum: 1 },
        totalAmount: { $sum: "$total" },
      },
    },
  ]);

  const statsMap = new Map(
    stats.map((s: { _id: string; receiptCount: number; totalAmount: number }) => [
      s._id.toString(),
      s,
    ])
  );

  const reportsWithStats = reports.map((report) => {
    const s = statsMap.get(report._id.toString());
    return {
      ...report.toObject(),
      receiptCount: s?.receiptCount || 0,
      totalAmount: s?.totalAmount || 0,
    };
  });

  return NextResponse.json({ reports: reportsWithStats });
});

export const POST = apiHandler(async (request: Request) => {
  await dbConnect();
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  if (body.dateFrom && !isValidDate(body.dateFrom)) {
    return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
  }
  if (body.dateTo && !isValidDate(body.dateTo)) {
    return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
  }

  const report = await Report.create({
    name: body.name,
    description: body.description,
    status: "draft",
    dateFrom: body.dateFrom ? new Date(body.dateFrom) : undefined,
    dateTo: body.dateTo ? new Date(body.dateTo) : undefined,
  });
  return NextResponse.json({ report }, { status: 201 });
});
