import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";
import Report from "@/lib/models/report";
import { seedCategories } from "@/lib/seed";

export async function GET() {
  await dbConnect();
  await seedCategories();

  const [totalReceipts, draftReports, recentReceipts, categoryBreakdown] = await Promise.all([
    Receipt.countDocuments(),
    Report.countDocuments({ status: "draft" }),
    Receipt.find()
      .select("-fileData")
      .populate("category")
      .sort({ date: -1 })
      .limit(5),
    Receipt.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryInfo.name",
          total: { $sum: "$total" },
          count: { $sum: 1 },
          color: { $first: "$categoryInfo.color" },
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  return NextResponse.json({
    totalReceipts,
    draftReports,
    recentReceipts,
    categoryBreakdown,
  });
}
