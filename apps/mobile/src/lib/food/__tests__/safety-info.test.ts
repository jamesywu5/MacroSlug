/// <reference types="jest" />

import { filterByDietaryRestrictions } from '../dietary-filter';
import { normalizeFoodRow } from '../filter-foods';
import { MOCK_FOOD_ROWS } from '../mock-foods';
import {
  getFoodSafetyInfo,
  HALAL_INFERRED_NOTE,
  KOSHER_NOTE,
} from '../safety-info';

const info = (allergens: string[], restrictions: Parameters<typeof getFoodSafetyInfo>[1] = []) =>
  getFoodSafetyInfo({ allergens }, restrictions);

describe('getFoodSafetyInfo grouping', () => {
  it('splits icons into allergens, ingredients, and diets', () => {
    const result = info(['Vegan', 'Soy', 'Gluten Friendly', 'Tree Nut', 'Pork', 'Alcohol']);
    expect(result.allergens).toEqual(['Soy', 'Tree nut']);
    expect(result.ingredients).toEqual(['Pork', 'Alcohol']);
    expect(result.diets).toEqual(['Vegan', 'Gluten friendly']);
    expect(result.unrecognized).toEqual([]);
    expect(result.noLabels).toBe(false);
  });

  it('matches mock spellings the same as scraper spellings', () => {
    expect(info(['eggs', 'tree nuts', 'milk']).allergens).toEqual(['Milk', 'Egg', 'Tree nut']);
    expect(info(['Egg', 'Tree Nut', 'Milk']).allergens).toEqual(['Milk', 'Egg', 'Tree nut']);
  });

  it('lists allergens in a fixed order with no duplicates', () => {
    expect(info(['Sesame', 'egg', 'Eggs', 'Fish']).allergens).toEqual(['Egg', 'Fish', 'Sesame']);
  });
});

describe('getFoodSafetyInfo unrecognized icons', () => {
  it('keeps unknown values, trimmed, in their original order', () => {
    expect(info(['gluten', ' Contains Mustard ', 'Vegan']).unrecognized).toEqual([
      'gluten',
      'Contains Mustard',
    ]);
  });

  it('drops empty values and removes duplicates ignoring case and spacing', () => {
    expect(info(['', '  ', 'Gluten', 'gluten', 'GLUTEN ']).unrecognized).toEqual(['Gluten']);
  });
});

describe('getFoodSafetyInfo noLabels', () => {
  it('is true for an empty list', () => {
    expect(info([]).noLabels).toBe(true);
  });

  it('is true for a list of only blank values', () => {
    expect(info(['', '   ']).noLabels).toBe(true);
  });

  it('is false when only unknown icons are listed', () => {
    expect(info(['mystery']).noLabels).toBe(false);
  });
});

describe('getFoodSafetyInfo restriction notes', () => {
  it('has no notes without restrictions', () => {
    expect(info(['Vegetarian']).restrictionNotes).toEqual([]);
  });

  it('always adds the kosher note when kosher is active', () => {
    expect(info([], ['kosher']).restrictionNotes).toEqual([KOSHER_NOTE]);
    expect(info(['Vegan'], ['kosher']).restrictionNotes).toEqual([KOSHER_NOTE]);
  });

  it('adds the halal note only when halal is inferred from vegetarian', () => {
    expect(info(['Vegetarian'], ['halal']).restrictionNotes).toEqual([HALAL_INFERRED_NOTE]);
    expect(info(['Vegan'], ['halal']).restrictionNotes).toEqual([HALAL_INFERRED_NOTE]);
    expect(info(['Halal'], ['halal']).restrictionNotes).toEqual([]);
    expect(info(['Halal', 'Vegetarian'], ['halal']).restrictionNotes).toEqual([]);
  });

  it.each(['vegan', 'vegetarian', 'pescatarian'] as const)(
    'adds no note for %s, since that rule needs a matching icon',
    (restriction) => {
      expect(info(['Vegan', 'Fish'], [restriction]).restrictionNotes).toEqual([]);
    },
  );

  it('combines notes for several restrictions in the order given', () => {
    expect(info(['Vegetarian'], ['kosher', 'halal']).restrictionNotes).toEqual([
      KOSHER_NOTE,
      HALAL_INFERRED_NOTE,
    ]);
  });
});

describe('mock data', () => {
  const foods = MOCK_FOOD_ROWS.map(normalizeFoodRow);

  it('flags every item that passes the kosher filter as not confirmed', () => {
    const { items } = filterByDietaryRestrictions(foods, ['kosher']);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(getFoodSafetyInfo(item, ['kosher']).restrictionNotes).toContain(KOSHER_NOTE);
    }
  });

  it('includes at least one item with no labels', () => {
    expect(foods.some((f) => getFoodSafetyInfo(f).noLabels)).toBe(true);
  });
});
