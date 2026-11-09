import {
  DINING_HALLS,
  MEAL_TYPES,
  type DiningHallId,
  type FoodFilters,
  type FoodItem,
  type FoodRow,
  type MealType,
  type NutrientKey,
} from './types';

/** Matches a `dining_hall` value to a known hall, ignoring case and spaces around the slash. */
export function parseDiningHall(value: string | null | undefined): DiningHallId | null {
  if (!value) return null;
  const key = value.replace(/\s+/g, '').toLowerCase();
  const hall = DINING_HALLS.find((h) => h.id.toLowerCase() === key);
  return hall ? hall.id : null;
}

/** Matches a `meal_type` value to a known meal, ignoring case and extra whitespace. */
export function parseMealType(value: string | null | undefined): MealType | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return MEAL_TYPES.find((m) => m.toLowerCase() === key) ?? null;
}

function cleanNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Turns a raw `food_db` row into a `FoodItem`.
 *
 * The scraper stores a missing macro as 0 (`macros.get("Protein", 0)`), so a
 * real 0 and "not on the label" look the same in the database. A food with
 * calories can't have 0g of protein, carbs and fat all at once, so when all
 * three are 0 and calories are above 0, we treat the macros as missing.
 */
export function normalizeFoodRow(row: FoodRow): FoodItem {
  const calories = cleanNumber(row.calories);
  let protein = cleanNumber(row.protein);
  let carbs = cleanNumber(row.total_carb);
  let fat = cleanNumber(row.total_fat);

  if (calories !== null && calories > 0 && protein === 0 && carbs === 0 && fat === 0) {
    protein = carbs = fat = null;
  }

  const values: Record<NutrientKey, number | null> = { calories, protein, carbs, fat };
  const missing = (Object.keys(values) as NutrientKey[]).filter((k) => values[k] === null);

  return {
    id: row.id,
    name: row.name?.trim() || 'Unnamed item',
    diningHall: parseDiningHall(row.dining_hall),
    meal: parseMealType(row.meal_type),
    calories,
    protein,
    carbs,
    fat,
    allergens: Array.isArray(row.allergens) ? row.allergens.filter(Boolean) : [],
    missing,
    scrapedAt: row.scraped_at,
  };
}

/**
 * Filters by dining hall, meal and search text, then sorts by name.
 * Items whose hall or meal couldn't be recognized only show under "All".
 */
export function filterFoods(items: readonly FoodItem[], filters: FoodFilters): FoodItem[] {
  const search = filters.search?.trim().toLowerCase() ?? '';

  return items
    .filter((item) => filters.diningHall === 'all' || item.diningHall === filters.diningHall)
    .filter((item) => filters.meal === 'all' || item.meal === filters.meal)
    .filter((item) => search === '' || item.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Picks the meal to show first based on the time of day:
 * before 11:00 → Breakfast, before 16:00 → Lunch, otherwise Dinner.
 */
export function defaultMealFor(date: Date): MealType {
  const hour = date.getHours();
  if (hour < 11) return 'Breakfast';
  if (hour < 16) return 'Lunch';
  return 'Dinner';
}

/** How many items each meal has, so the UI can show counts or flag empty meals. */
export function countByMeal(items: readonly FoodItem[]): Record<MealType, number> {
  const counts: Record<MealType, number> = { Breakfast: 0, Lunch: 0, Dinner: 0 };
  for (const item of items) {
    if (item.meal) counts[item.meal] += 1;
  }
  return counts;
}
