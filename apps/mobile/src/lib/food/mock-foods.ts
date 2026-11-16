import type { FoodRow } from './types';

const SCRAPED_AT = '2026-11-09T08:00:00Z';

let nextId = 1;
function row(
  dining_hall: string,
  meal_type: string,
  name: string,
  calories: number | null,
  protein: number | null,
  total_carb: number | null,
  total_fat: number | null,
  allergens: string[] = [],
): FoodRow {
  return {
    id: nextId++,
    dining_hall,
    meal_type,
    name,
    calories,
    protein,
    total_carb,
    total_fat,
    allergens,
    scraped_at: SCRAPED_AT,
  };
}

/**
 * Fake menu used until the app reads real data. It covers every hall and meal,
 * plus a few rows with missing nutrition data so those states can be seen.
 */
export const MOCK_FOOD_ROWS: FoodRow[] = [
  // Cowell/Stevenson
  row('Cowell/Stevenson', 'Breakfast', 'Scrambled Eggs', 180, 14, 2, 12, ['eggs']),
  row('Cowell/Stevenson', 'Breakfast', 'Oatmeal', 150, 5, 27, 3, ['gluten']),
  row('Cowell/Stevenson', 'Lunch', 'Turkey Sandwich', 380, 24, 42, 12, ['gluten', 'soy']),
  row('Cowell/Stevenson', 'Lunch', 'Garden Salad', 70, 2, 10, 3),
  row('Cowell/Stevenson', 'Dinner', 'Tofu Stir Fry', 240, 15, 26, 9, ['soy']),
  row('Cowell/Stevenson', 'Dinner', 'Jasmine Rice', 200, 4, 45, 0),

  // Crown/Merrill
  row('Crown/Merrill', 'Breakfast', 'Buttermilk Pancakes', 310, 7, 48, 10, ['gluten', 'milk', 'eggs']),
  row('Crown/Merrill', 'Breakfast', 'Turkey Sausage', 140, 0, 0, 0), // macros missing
  row('Crown/Merrill', 'Lunch', 'Grilled Chicken', 220, 38, 0, 6),
  row('Crown/Merrill', 'Lunch', 'Black Bean Burger', 290, 14, 38, 9, ['gluten', 'soy']),
  row('Crown/Merrill', 'Dinner', 'Spaghetti Marinara', 350, 12, 62, 6, ['gluten']),
  row('Crown/Merrill', 'Dinner', 'Roasted Broccoli', 60, 3, 8, 2),

  // Nine/Ten
  row('Nine/Ten', 'Breakfast', 'Breakfast Burrito', 420, 19, 40, 20, ['gluten', 'milk', 'eggs']),
  row('Nine/Ten', 'Lunch', 'Chicken Tikka Masala', 330, 26, 18, 16, ['milk']),
  row('Nine/Ten', 'Lunch', 'Chef Special', null, null, null, null), // everything missing
  row('Nine/Ten', 'Dinner', 'Beef Tacos', 310, 18, 24, 15, ['milk']),

  // Oakes/RCC
  row('Oakes/RCC', 'Breakfast', 'Greek Yogurt Parfait', 210, 12, 30, 5, ['milk', 'tree nuts']),
  row('Oakes/RCC', 'Lunch', 'Veggie Pho', 280, 9, 50, 4, ['soy']),
  row('Oakes/RCC', 'Dinner', 'Teriyaki Salmon', 300, 28, 12, 14, ['fish', 'soy']),
  row('Oakes/RCC', 'Dinner', 'Steamed Edamame', 120, 11, 9, null, ['soy']), // fat missing

  // Porter/Kresge (no breakfast on purpose, to show the empty state)
  row('Porter/Kresge', 'Lunch', 'Margherita Flatbread', 330, 13, 38, 14, ['gluten', 'milk']),
  row('Porter/Kresge', 'Lunch', 'Minestrone Soup', 110, 4, 18, 2),
  row('Porter/Kresge', 'Dinner', 'Cheese Pizza', 290, 12, 35, 11, ['gluten', 'milk']),
  row('Porter/Kresge', 'Dinner', 'Caesar Salad', 190, 6, 9, 15, ['milk', 'eggs', 'fish']),
];
