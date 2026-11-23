/// <reference types="jest" />

import { DIETARY_RESTRICTION_IDS } from '../../../features/preferences/types';
import {
  filterByDietaryRestrictions,
  getFoodTags,
  isCompatibleWithRestriction,
  normalizeFoodTag,
  type FoodTag,
} from '../dietary-filter';
import { normalizeFoodRow } from '../filter-foods';
import { MOCK_FOOD_ROWS } from '../mock-foods';

const tags = (...list: FoodTag[]) => new Set<FoodTag>(list);
const food = (name: string, allergens: string[]) => ({ name, allergens });

describe('normalizeFoodTag', () => {
  it('ignores case and surrounding or repeated whitespace', () => {
    expect(normalizeFoodTag('  VEGAN ')).toBe('vegan');
    expect(normalizeFoodTag('Gluten   Friendly')).toBe('gluten-friendly');
  });

  it('maps scraper and mock spellings to the same tag', () => {
    expect(normalizeFoodTag('Egg')).toBe('egg');
    expect(normalizeFoodTag('eggs')).toBe('egg');
    expect(normalizeFoodTag('Tree Nut')).toBe('tree-nut');
    expect(normalizeFoodTag('tree nuts')).toBe('tree-nut');
    expect(normalizeFoodTag('Peanuts')).toBe('peanut');
  });

  it('returns null for empty or unknown values', () => {
    expect(normalizeFoodTag('')).toBeNull();
    expect(normalizeFoodTag('   ')).toBeNull();
    expect(normalizeFoodTag('gluten')).toBeNull();
    expect(normalizeFoodTag('Spicy')).toBeNull();
    expect(normalizeFoodTag(null)).toBeNull();
    expect(normalizeFoodTag(undefined)).toBeNull();
  });
});

describe('getFoodTags', () => {
  it('collects canonical tags and drops unknown ones', () => {
    expect(getFoodTags({ allergens: ['Vegan', 'Soy', 'Mystery', 'soy'] })).toEqual(
      tags('vegan', 'soy'),
    );
  });
});

describe('isCompatibleWithRestriction', () => {
  it.each(DIETARY_RESTRICTION_IDS.filter((r) => r !== 'kosher'))(
    'never treats an item with no icons as %s',
    (restriction) => {
      expect(isCompatibleWithRestriction(tags(), restriction)).toBe(false);
    },
  );

  it('vegan requires the Vegan icon', () => {
    expect(isCompatibleWithRestriction(tags('vegan'), 'vegan')).toBe(true);
    expect(isCompatibleWithRestriction(tags('vegetarian'), 'vegan')).toBe(false);
  });

  it('vegetarian accepts Vegan or Vegetarian icons', () => {
    expect(isCompatibleWithRestriction(tags('vegan'), 'vegetarian')).toBe(true);
    expect(isCompatibleWithRestriction(tags('vegetarian', 'milk'), 'vegetarian')).toBe(true);
    expect(isCompatibleWithRestriction(tags('halal'), 'vegetarian')).toBe(false);
  });

  it('pescatarian accepts vegetarian items and fish without beef or pork', () => {
    expect(isCompatibleWithRestriction(tags('vegetarian'), 'pescatarian')).toBe(true);
    expect(isCompatibleWithRestriction(tags('fish', 'soy'), 'pescatarian')).toBe(true);
    expect(isCompatibleWithRestriction(tags('shellfish'), 'pescatarian')).toBe(true);
    expect(isCompatibleWithRestriction(tags('fish', 'pork'), 'pescatarian')).toBe(false);
    expect(isCompatibleWithRestriction(tags('shellfish', 'beef'), 'pescatarian')).toBe(false);
  });

  it('halal accepts Halal or vegetarian items without pork or alcohol', () => {
    expect(isCompatibleWithRestriction(tags('halal'), 'halal')).toBe(true);
    expect(isCompatibleWithRestriction(tags('vegan'), 'halal')).toBe(true);
    expect(isCompatibleWithRestriction(tags('vegetarian', 'alcohol'), 'halal')).toBe(false);
    expect(isCompatibleWithRestriction(tags('halal', 'pork'), 'halal')).toBe(false);
    expect(isCompatibleWithRestriction(tags('halal', 'alcohol'), 'halal')).toBe(false);
  });

  it('kosher hides pork, shellfish, and beef with milk', () => {
    expect(isCompatibleWithRestriction(tags(), 'kosher')).toBe(true);
    expect(isCompatibleWithRestriction(tags('beef'), 'kosher')).toBe(true);
    expect(isCompatibleWithRestriction(tags('milk'), 'kosher')).toBe(true);
    expect(isCompatibleWithRestriction(tags('pork'), 'kosher')).toBe(false);
    expect(isCompatibleWithRestriction(tags('shellfish'), 'kosher')).toBe(false);
    expect(isCompatibleWithRestriction(tags('beef', 'milk'), 'kosher')).toBe(false);
  });
});

describe('real dining hall icons', () => {
  // Icon lists copied from scraped items in apps/scraper/audit.md.
  const pepperoniPizza = getFoodTags({
    allergens: ['Soy', 'Egg', 'Milk', 'Sesame', 'Wheat', 'Beef', 'Pork'],
  });
  const halalChicken = getFoodTags({ allergens: ['Gluten Friendly', 'Halal'] });
  const harissaTofu = getFoodTags({ allergens: ['Vegan', 'Soy', 'Gluten Friendly'] });

  it.each(DIETARY_RESTRICTION_IDS)('pepperoni pizza fails %s', (restriction) => {
    expect(isCompatibleWithRestriction(pepperoniPizza, restriction)).toBe(false);
  });

  it.each(DIETARY_RESTRICTION_IDS)('harissa tofu passes %s', (restriction) => {
    expect(isCompatibleWithRestriction(harissaTofu, restriction)).toBe(true);
  });

  it('halal chicken passes halal and kosher only', () => {
    const passing = DIETARY_RESTRICTION_IDS.filter((r) =>
      isCompatibleWithRestriction(halalChicken, r),
    );
    expect(passing).toEqual(['halal', 'kosher']);
  });
});

describe('unknown restrictions', () => {
  it('does not hide anything for a restriction the filter does not know', () => {
    const unknown = 'paleo' as (typeof DIETARY_RESTRICTION_IDS)[number];
    expect(isCompatibleWithRestriction(tags(), unknown)).toBe(true);
  });
});

describe('filterByDietaryRestrictions', () => {
  const items = [
    food('Salad', ['Vegan']),
    food('Pizza', ['Vegetarian', 'Milk']),
    food('Chicken', ['Halal']),
    food('Bacon', ['Pork']),
    food('Mystery', []),
  ];

  it('returns every item when no restrictions are selected', () => {
    const result = filterByDietaryRestrictions(items, []);
    expect(result.items).toEqual(items);
    expect(result.items).not.toBe(items);
    expect(result.hiddenCount).toBe(0);
  });

  it('keeps only items that pass every restriction and counts the rest', () => {
    const result = filterByDietaryRestrictions(items, ['vegetarian', 'halal']);
    expect(result.items.map((f) => f.name)).toEqual(['Salad', 'Pizza']);
    expect(result.hiddenCount).toBe(3);
  });

  it('preserves order and does not change the input', () => {
    const before = items.map((f) => ({ ...f, allergens: [...f.allergens] }));
    const result = filterByDietaryRestrictions(items, ['halal']);
    expect(result.items.map((f) => f.name)).toEqual(['Salad', 'Pizza', 'Chicken']);
    expect(items).toEqual(before);
  });
});

describe('mock menu', () => {
  const foods = MOCK_FOOD_ROWS.map(normalizeFoodRow);

  it.each(DIETARY_RESTRICTION_IDS)('%s keeps some items and hides some items', (restriction) => {
    const result = filterByDietaryRestrictions(foods, [restriction]);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.hiddenCount).toBeGreaterThan(0);
  });
});
