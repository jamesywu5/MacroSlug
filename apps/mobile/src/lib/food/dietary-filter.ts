import type { DietaryRestrictionId } from '@/features/preferences/types';

import type { FoodItem } from './types';

/**
 * Filters menu items by the dietary restrictions saved on the Food
 * Preferences screen.
 *
 * The only diet data a food has is the dining hall's icon list (the
 * `allergens` column, e.g. `["Vegan", "Soy", "Gluten Friendly"]`), so every
 * rule here works from those icons. An item only passes when its icons show
 * it fits; a missing icon never counts as proof.
 */

export const FOOD_TAGS = [
  'vegan',
  'vegetarian',
  'halal',
  'gluten-friendly',
  'pork',
  'beef',
  'fish',
  'shellfish',
  'alcohol',
  'milk',
  'egg',
  'soy',
  'wheat',
  'sesame',
  'peanut',
  'tree-nut',
] as const;

export type FoodTag = (typeof FOOD_TAGS)[number];

/** Spellings seen in scraper output and mock data, keyed by their normalized form. */
const TAG_ALIASES: Record<string, FoodTag> = {
  vegan: 'vegan',
  vegetarian: 'vegetarian',
  veggie: 'vegetarian',
  halal: 'halal',
  'gluten friendly': 'gluten-friendly',
  'gluten-friendly': 'gluten-friendly',
  pork: 'pork',
  beef: 'beef',
  fish: 'fish',
  shellfish: 'shellfish',
  alcohol: 'alcohol',
  milk: 'milk',
  dairy: 'milk',
  egg: 'egg',
  eggs: 'egg',
  soy: 'soy',
  wheat: 'wheat',
  sesame: 'sesame',
  peanut: 'peanut',
  peanuts: 'peanut',
  'tree nut': 'tree-nut',
  'tree nuts': 'tree-nut',
  treenut: 'tree-nut',
  treenuts: 'tree-nut',
};

/** Maps one raw icon name to a canonical tag, or `null` if it is empty or unknown. */
export function normalizeFoodTag(raw: string | null | undefined): FoodTag | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (key === '') return null;
  return TAG_ALIASES[key] ?? null;
}

/** The set of canonical tags for a food item. Unknown icons are ignored. */
export function getFoodTags(item: Pick<FoodItem, 'allergens'>): Set<FoodTag> {
  const tags = new Set<FoodTag>();
  for (const raw of item.allergens) {
    const tag = normalizeFoodTag(raw);
    if (tag) tags.add(tag);
  }
  return tags;
}

function isVegetarian(tags: ReadonlySet<FoodTag>): boolean {
  return tags.has('vegan') || tags.has('vegetarian');
}

/** Whether an item with these tags fits one dietary restriction. */
export function isCompatibleWithRestriction(
  tags: ReadonlySet<FoodTag>,
  restriction: DietaryRestrictionId,
): boolean {
  switch (restriction) {
    case 'vegan':
      return tags.has('vegan');
    case 'vegetarian':
      return isVegetarian(tags);
    case 'pescatarian':
      return (
        isVegetarian(tags) ||
        ((tags.has('fish') || tags.has('shellfish')) && !tags.has('pork') && !tags.has('beef'))
      );
    case 'halal':
      return (
        !tags.has('pork') &&
        !tags.has('alcohol') &&
        (tags.has('halal') || isVegetarian(tags))
      );
    case 'kosher':
      // UNVERIFIED: the dining halls have no kosher icon, so this only removes
      // obvious conflicts. Anything that passes is not confirmed kosher (S2-4.3
      // surfaces a warning for this).
      return !tags.has('pork') && !tags.has('shellfish') && !(tags.has('beef') && tags.has('milk'));
    default: {
      // A restriction this module doesn't know can't be checked, so don't hide anything for it.
      const unknown: never = restriction;
      void unknown;
      return true;
    }
  }
}

export type DietaryFilterResult<T> = {
  items: T[];
  hiddenCount: number;
};

/**
 * Keeps only items that pass every selected restriction, in their original
 * order. The input array is not changed.
 */
export function filterByDietaryRestrictions<T extends Pick<FoodItem, 'allergens'>>(
  items: readonly T[],
  restrictions: readonly DietaryRestrictionId[],
): DietaryFilterResult<T> {
  if (restrictions.length === 0) {
    return { items: [...items], hiddenCount: 0 };
  }

  const kept = items.filter((item) => {
    const tags = getFoodTags(item);
    return restrictions.every((r) => isCompatibleWithRestriction(tags, r));
  });

  return { items: kept, hiddenCount: items.length - kept.length };
}
