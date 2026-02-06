import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/category";
import { seedCategories } from "@/lib/seed";

export async function GET() {
  await dbConnect();
  await seedCategories();
  const categories = await Category.find().sort({ name: 1 });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  const category = await Category.create({
    name: body.name,
    color: body.color || "#a3a3a3",
    isDefault: false,
  });
  return NextResponse.json({ category }, { status: 201 });
}
