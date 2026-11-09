import { getSupabaseClient } from "../lib/supabase.ts";

export async function getFoods() {
  const { data, error } = await getSupabaseClient()
    .from("food_db")
    .select("id, dining_hall, meal_type, name, calories, allergens, total_fat, total_carb, protein, scraped_at")
    .order("scraped_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
