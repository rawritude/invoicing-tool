import { dbConnect } from "./db";
import Category from "./models/category";
import { DEFAULT_CATEGORIES } from "./constants";

export async function seedCategories() {
  await dbConnect();
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
  }
}
