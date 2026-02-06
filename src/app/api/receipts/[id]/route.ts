import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const receipt = await Receipt.findById(id).populate("category").populate("reportId");
  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  // Convert fileData to base64 for the client
  const obj = receipt.toObject();
  if (obj.fileData) {
    obj.fileData = Buffer.from(obj.fileData).toString("base64");
  }

  return NextResponse.json({ receipt: obj });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  // Don't allow updating fileData through this endpoint
  delete body.fileData;

  if (body.date) {
    body.date = new Date(body.date);
  }

  const receipt = await Receipt.findByIdAndUpdate(id, body, { new: true })
    .populate("category")
    .populate("reportId");

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ receipt: { ...receipt.toObject(), fileData: undefined } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const receipt = await Receipt.findByIdAndDelete(id);
  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
