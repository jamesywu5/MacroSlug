/// <reference types="jest" />

import {
  countByMeal,
  defaultMealFor,
  filterFoods,
  normalizeFoodRow,
  parseDiningHall,
  parseMealType,
} from '../filter-foods';
import { MOCK_FOOD_ROWS } from '../mock-foods';
import { DINING_HALLS, MEAL_TYPES, type FoodRow } from '../types';

function makeRow(overrides: Partial<FoodRow> = {}): FoodRow {
  return {
    id: 1,
    dining_hall: 'Crown/Merrill',
    meal_type: 'Lunch',
    name: 'Test Food',
    calories: 200,
    protein: 10,
    total_carb: 20,
    total_fat: 5,
    allergens: [],
    scraped_at: '2026-11-09T08:00:00Z',
    ...overrides,
  };
}

const foods = MOCK_FOOD_ROWS.map(normalizeFoodRow);

describe('filterFoods', () => {
  it('returns everything when both filters are "all"', () => {
    expect(filterFoods(foods, { diningHall: 'all', meal: 'all' })).toHaveLength(foods.length);
  });

  it.each(DINING_HALLS.map((h) => h.id))('only returns items from %s', (hall) => {
    const result = filterFoods(foods, { diningHall: hall, meal: 'all' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((f) => f.diningHall === hall)).toBe(true);
  });

  it.each(MEAL_TYPES)('only returns %s items', (meal) => {
    const result = filterFoods(foods, { diningHall: 'all', meal });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((f) => f.meal === meal)).toBe(true);
  });

  it('combines hall and meal filters', () => {
    const result = filterFoods(foods, { diningHall: 'Oakes/RCC', meal: 'Dinner' });
    expect(result.map((f) => f.name)).toEqual(['Steamed Edamame', 'Teriyaki Salmon']);
  });

  it('returns an empty list when a hall serves nothing for that meal', () => {
    expect(filterFoods(foods, { diningHall: 'Porter/Kresge', meal: 'Breakfast' })).toEqual([]);
  });

  it('returns an empty list for an empty menu', () => {
    expect(filterFoods([], { diningHall: 'Crown/Merrill', meal: 'Lunch' })).toEqual([]);
  });

  it('only shows items with an unknown hall or meal under "all"', () => {
    const odd = [
      normalizeFoodRow(makeRow({ id: 1, dining_hall: 'Stevenson Coffee House' })),
      normalizeFoodRow(makeRow({ id: 2, meal_type: 'Late Night' })),
    ];
    expect(filterFoods(odd, { diningHall: 'all', meal: 'all' })).toHaveLength(2);
    expect(filterFoods(odd, { diningHall: 'Crown/Merrill', meal: 'all' })).toHaveLength(1);
    expect(filterFoods(odd, { diningHall: 'all', meal: 'Lunch' })).toHaveLength(1);
    expect(filterFoods(odd, { diningHall: 'Crown/Merrill', meal: 'Lunch' })).toHaveLength(0);
  });

  it('matches search text case-insensitively and ignores surrounding spaces', () => {
    const result = filterFoods(foods, { diningHall: 'all', meal: 'all', search: '  PIZZA ' });
    expect(result.map((f) => f.name)).toEqual(['Cheese Pizza']);
  });

  it('treats a blank search as no search', () => {
    expect(filterFoods(foods, { diningHall: 'all', meal: 'all', search: '   ' })).toHaveLength(
      foods.length,
    );
  });

  it('sorts results by name', () => {
    const names = filterFoods(foods, { diningHall: 'all', meal: 'Lunch' }).map((f) => f.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('does not change the list it was given', () => {
    const copy = [...foods];
    filterFoods(foods, { diningHall: 'Nine/Ten', meal: 'Dinner' });
    expect(foods).toEqual(copy);
  });
});

describe('parseDiningHall / parseMealType', () => {
  it('accepts different casing and spacing', () => {
    expect(parseDiningHall('crown / merrill')).toBe('Crown/Merrill');
    expect(parseDiningHall(' OAKES/RCC ')).toBe('Oakes/RCC');
    expect(parseMealType('  dinner ')).toBe('Dinner');
  });

  it('returns null for unknown or empty values', () => {
    expect(parseDiningHall('Unknown')).toBeNull();
    expect(parseDiningHall('')).toBeNull();
    expect(parseDiningHall(null)).toBeNull();
    expect(parseMealType('Brunch')).toBeNull();
    expect(parseMealType(undefined)).toBeNull();
  });
});

describe('defaultMealFor', () => {
  it.each([
    ['00:00', 'Breakfast'],
    ['07:00', 'Breakfast'],
    ['10:59', 'Breakfast'],
    ['11:00', 'Lunch'],
    ['15:59', 'Lunch'],
    ['16:00', 'Dinner'],
    ['23:59', 'Dinner'],
  ])('at %s shows %s', (time, meal) => {
    const [h, m] = time.split(':').map(Number);
    expect(defaultMealFor(new Date(2026, 10, 9, h, m))).toBe(meal);
  });
});

describe('normalizeFoodRow (missing data)', () => {
  it('keeps complete rows as they are', () => {
    const item = normalizeFoodRow(makeRow());
    expect(item).toMatchObject({ calories: 200, protein: 10, carbs: 20, fat: 5, missing: [] });
  });

  it('treats all-zero macros on a food with calories as missing', () => {
    const item = normalizeFoodRow(makeRow({ protein: 0, total_carb: 0, total_fat: 0 }));
    expect(item.protein).toBeNull();
    expect(item.missing).toEqual(['protein', 'carbs', 'fat']);
  });

  it('keeps a single real zero, like 0g of carbs in chicken', () => {
    const item = normalizeFoodRow(makeRow({ total_carb: 0 }));
    expect(item.carbs).toBe(0);
    expect(item.missing).toEqual([]);
  });

  it('keeps all-zero macros when calories are also 0 (water, black coffee)', () => {
    const item = normalizeFoodRow(
      makeRow({ calories: 0, protein: 0, total_carb: 0, total_fat: 0 }),
    );
    expect(item.missing).toEqual([]);
  });

  it('flags null, negative and NaN values as missing', () => {
    const item = normalizeFoodRow(
      makeRow({ calories: null, protein: -1, total_carb: Number.NaN, total_fat: 3 }),
    );
    expect(item.missing).toEqual(['calories', 'protein', 'carbs']);
    expect(item.fat).toBe(3);
  });

  it('handles a null allergen list and a blank name', () => {
    const item = normalizeFoodRow(makeRow({ allergens: null, name: '   ' }));
    expect(item.allergens).toEqual([]);
    expect(item.name).toBe('Unnamed item');
  });
});

describe('countByMeal', () => {
  it('counts each meal and skips unknown meals', () => {
    const items = [
      normalizeFoodRow(makeRow({ id: 1, meal_type: 'Breakfast' })),
      normalizeFoodRow(makeRow({ id: 2, meal_type: 'Lunch' })),
      normalizeFoodRow(makeRow({ id: 3, meal_type: 'Lunch' })),
      normalizeFoodRow(makeRow({ id: 4, meal_type: 'Late Night' })),
    ];
    expect(countByMeal(items)).toEqual({ Breakfast: 1, Lunch: 2, Dinner: 0 });
  });
});
