import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/category";
import { seedCategories } from "@/lib/seed";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  await dbConnect();
  await seedCategories();
  const categories = await Category.find().sort({ name: 1 });
  return NextResponse.json({ categories });
});

export const POST = apiHandler(async (request: Request) => {
  await dbConnect();
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const category = await Category.create({
    name: body.name,
    color: body.color || "#a3a3a3",
    isDefault: false,
  });
  return NextResponse.json({ category }, { status: 201 });
});
