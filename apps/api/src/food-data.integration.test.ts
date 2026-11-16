import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test("reads representative dining records from persistent storage", async (t) => {
  if (!supabaseUrl || !serviceRoleKey) {
    t.skip("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/api/.env.test");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("food_db")
    .select("dining_hall, meal_type, name, calories, allergens, total_fat, total_carb, protein")
    .in("name", ["Scrambled Eggs", "Grilled Chicken", "Cheese Pizza", "Tofu Stir Fry"]);

  assert.ifError(error);
  assert.ok(data);

  const foodsByName = new Map(data.map((food) => [food.name, food]));
  assert.equal(foodsByName.size, 4, "expected all representative seeded dining records");

  assert.deepEqual(foodsByName.get("Scrambled Eggs"), {
    dining_hall: "Crown/Merrill",
    meal_type: "Breakfast",
    name: "Scrambled Eggs",
    calories: 180,
    allergens: ["egg"],
    total_fat: 12,
    total_carb: 2,
    protein: 14,
  });
  assert.equal(foodsByName.get("Grilled Chicken")?.protein, 38);
  assert.deepEqual(foodsByName.get("Cheese Pizza")?.allergens, ["milk", "wheat"]);
  assert.equal(foodsByName.get("Tofu Stir Fry")?.dining_hall, "Cowell/Stevenson");
});
