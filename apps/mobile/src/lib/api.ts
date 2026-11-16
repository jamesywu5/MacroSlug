export type Food = {
  id: number;
  dining_hall: string;
  meal_type: string;
  name: string;
  calories: number;
  allergens: string[];
  total_fat: number;
  total_carb: number;
  protein: number;
  scraped_at: string;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

export async function fetchFoods(): Promise<Food[]> {
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL must be configured");
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/foods`);
  if (!response.ok) {
    throw new Error(`Unable to retrieve dining data (${response.status})`);
  }

  const result = (await response.json()) as { foods: Food[] };
  return result.foods;
}
