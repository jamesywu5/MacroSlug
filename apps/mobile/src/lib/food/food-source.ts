import { MOCK_FOOD_ROWS } from './mock-foods';
import type { DiningHallId, FoodRow, MealType } from './types';

export type FoodQuery = {
  diningHall?: DiningHallId;
  meal?: MealType;
};

/**
 * Where the food list gets its rows from. The screen only talks to this
 * interface, so switching from mock data to real data is a one-line change
 * in `getFoodSource()`.
 */
export interface FoodSource {
  getFoods(query?: FoodQuery): Promise<FoodRow[]>;
}

/** Returns the fake menu in `mock-foods.ts` after a short delay, like a network call would. */
export const mockFoodSource: FoodSource = {
  async getFoods(query = {}) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_FOOD_ROWS.filter(
      (row) =>
        (!query.diningHall || row.dining_hall === query.diningHall) &&
        (!query.meal || row.meal_type === query.meal),
    );
  },
};

/**
 * Reads `food_db` through the MacroSlug API (apps/api).
 *
 * The app doesn't query Supabase directly: `food_db` has row-level security
 * with no policies, so only the service role key (which must stay on the
 * server) can read it. Once the API has a `GET /api/foods` route, set
 * `EXPO_PUBLIC_API_URL` and this source is used automatically.
 */
export function createApiFoodSource(baseUrl: string): FoodSource {
  return {
    async getFoods(query = {}) {
      const params = new URLSearchParams();
      if (query.diningHall) params.set('dining_hall', query.diningHall);
      if (query.meal) params.set('meal_type', query.meal);

      const qs = params.toString();
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/foods${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Couldn't load the menu (HTTP ${res.status})`);
      return (await res.json()) as FoodRow[];
    },
  };
}

/** Uses the API when `EXPO_PUBLIC_API_URL` is set, otherwise the mock data. */
export function getFoodSource(): FoodSource {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return apiUrl ? createApiFoodSource(apiUrl) : mockFoodSource;
}
