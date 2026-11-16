/**
 * Types for dining hall menu data.
 *
 * `FoodRow` mirrors one row of the `food_db` table in Supabase
 * (see supabase/migrations/*_create_food_tables.sql). `FoodItem` is the
 * cleaned-up version the app actually renders.
 */

/** The `dining_hall` values the scraper writes (apps/scraper/ingest_food.py). */
export const DINING_HALLS = [
  { id: 'Cowell/Stevenson', label: 'Cowell / Stevenson' },
  { id: 'Crown/Merrill', label: 'Crown / Merrill' },
  { id: 'Nine/Ten', label: 'Nine / JRL' },
  { id: 'Oakes/RCC', label: 'Oakes / RCC' },
  { id: 'Porter/Kresge', label: 'Porter / Kresge' },
] as const;

export type DiningHallId = (typeof DINING_HALLS)[number]['id'];

/** The `meal_type` values the scraper writes (apps/scraper/web_scraper.py). */
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/** A raw row from `food_db`, as Supabase or the API would return it. */
export type FoodRow = {
  id: number;
  dining_hall: string;
  meal_type: string;
  name: string;
  calories: number | null;
  allergens: string[] | null;
  total_fat: number | null;
  total_carb: number | null;
  protein: number | null;
  scraped_at: string;
};

export type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fat';

/** A food item ready for the UI. `null` means the value is missing, not zero. */
export type FoodItem = {
  id: number;
  name: string;
  diningHall: DiningHallId | null;
  meal: MealType | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  allergens: string[];
  /** Which nutrition values are missing, so the card can flag them. */
  missing: NutrientKey[];
  scrapedAt: string;
};

/** `'all'` means "don't filter on this". */
export type FoodFilters = {
  diningHall: DiningHallId | 'all';
  meal: MealType | 'all';
  search?: string;
};
