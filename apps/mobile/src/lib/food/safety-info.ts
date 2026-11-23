import type { DietaryRestrictionId } from '../../features/preferences/types';

import { getFoodTags, normalizeFoodTag, type FoodTag } from './dietary-filter';
import type { FoodItem } from './types';

/**
 * Safety info for one food card. Every value here comes from the dining
 * hall's icon list, which nobody checks, so the UI must present it as
 * unverified.
 */

export const ALLERGEN_DISCLAIMER =
  "Allergen and ingredient info comes from dining hall labels and isn't verified. If you have a food allergy, check with dining hall staff.";

export const NO_LABELS_WARNING = 'No allergen info listed. Ask dining hall staff.';

export const KOSHER_NOTE = "Not confirmed kosher. The dining halls don't label kosher food.";

export const HALAL_INFERRED_NOTE = "Halal not labeled. Shown because it's marked vegetarian.";

const ALLERGEN_TAGS = [
  'milk',
  'egg',
  'fish',
  'shellfish',
  'soy',
  'wheat',
  'sesame',
  'peanut',
  'tree-nut',
] as const satisfies readonly FoodTag[];

const INGREDIENT_TAGS = ['pork', 'beef', 'alcohol'] as const satisfies readonly FoodTag[];

const DIET_TAGS = ['vegan', 'vegetarian', 'halal', 'gluten-friendly'] as const satisfies readonly FoodTag[];

const TAG_LABELS: Record<FoodTag, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  halal: 'Halal',
  'gluten-friendly': 'Gluten friendly',
  pork: 'Pork',
  beef: 'Beef',
  fish: 'Fish',
  shellfish: 'Shellfish',
  alcohol: 'Alcohol',
  milk: 'Milk',
  egg: 'Egg',
  soy: 'Soy',
  wheat: 'Wheat',
  sesame: 'Sesame',
  peanut: 'Peanut',
  'tree-nut': 'Tree nut',
};

export type FoodSafetyInfo = {
  /** Allergen labels, e.g. `["Milk", "Tree nut"]`. */
  allergens: string[];
  /** Ingredient labels such as Pork, Beef, Alcohol. */
  ingredients: string[];
  /** Diet labels such as Vegan, Halal. */
  diets: string[];
  /** Raw icons the app doesn't recognize. Shown as-is so no dining hall label is dropped. */
  unrecognized: string[];
  /** True when the dining hall listed no icons at all for this item. */
  noLabels: boolean;
  /** Warnings for active restrictions this item passes without proof. */
  restrictionNotes: string[];
};

function labelsFor(tags: ReadonlySet<FoodTag>, group: readonly FoodTag[]): string[] {
  return group.filter((t) => tags.has(t)).map((t) => TAG_LABELS[t]);
}

/** Builds the safety info shown on a food card for the given active restrictions. */
export function getFoodSafetyInfo(
  item: Pick<FoodItem, 'allergens'>,
  activeRestrictions: readonly DietaryRestrictionId[] = [],
): FoodSafetyInfo {
  const tags = getFoodTags(item);

  const raw = item.allergens
    .filter((a): a is string => typeof a === 'string')
    .map((a) => a.trim())
    .filter((a) => a !== '');

  const unrecognized: string[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (normalizeFoodTag(value) !== null) continue;
    const key = value.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    unrecognized.push(value);
  }

  const restrictionNotes: string[] = [];
  for (const restriction of activeRestrictions) {
    if (restriction === 'kosher') {
      restrictionNotes.push(KOSHER_NOTE);
    } else if (
      restriction === 'halal' &&
      !tags.has('halal') &&
      (tags.has('vegan') || tags.has('vegetarian'))
    ) {
      // The halal rule lets vegetarian items through without a Halal icon.
      restrictionNotes.push(HALAL_INFERRED_NOTE);
    }
  }

  return {
    allergens: labelsFor(tags, ALLERGEN_TAGS),
    ingredients: labelsFor(tags, INGREDIENT_TAGS),
    diets: labelsFor(tags, DIET_TAGS),
    unrecognized,
    noLabels: raw.length === 0,
    restrictionNotes,
  };
}
