import { dbConnect } from "./db";
import Category from "./models/category";
import { DEFAULT_CATEGORIES } from "./constants";

export async function seedCategories() {
  await dbConnect();
  try {
    await Category.insertMany(DEFAULT_CATEGORIES, { ordered: false });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code !== 11000) throw error;
  }
}
