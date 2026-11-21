import {
  DIETARY_RESTRICTION_OPTIONS,
  type DietaryRestrictionId,
  type FoodPreferencesState,
} from '../../features/preferences/types';

import { filterByDietaryRestrictions } from './dietary-filter';
import { countByMeal, filterFoods } from './filter-foods';
import type { DiningHallId, FoodItem, MealType } from './types';

export type MenuViewInput = {
  foods: readonly FoodItem[];
  restrictions: readonly DietaryRestrictionId[];
  /** "Show all" toggle: shows unfiltered results without changing saved preferences. */
  showAll: boolean;
  diningHall: DiningHallId | 'all';
  meal: MealType;
};

export type MenuView = {
  /** Items to list for the selected hall and meal. */
  visible: FoodItem[];
  /** Item counts per meal for the selected hall, after dietary filtering. */
  counts: Record<MealType, number>;
  /** Whether the dietary banner should show (any restriction is saved). */
  showBanner: boolean;
  /** Whether dietary filtering is currently applied. */
  filtersActive: boolean;
  /** Labels of the saved restrictions, in catalog order. */
  restrictionLabels: string[];
  /** How many items across the whole menu the restrictions hide. */
  hiddenCount: number;
  /** True when the selected hall and meal has items, but the restrictions hide all of them. */
  emptyBecauseOfDiet: boolean;
};

/**
 * Works out what the Menu tab shows. Dietary restrictions are applied first,
 * then dining hall and meal, so meal counts only include items the student can eat.
 */
export function buildMenuView(input: MenuViewInput): MenuView {
  const { foods, restrictions, showAll, diningHall, meal } = input;

  const dietary = filterByDietaryRestrictions(foods, restrictions);
  const filtersActive = restrictions.length > 0 && !showAll;
  const base = filtersActive ? dietary.items : foods;

  const inHall = filterFoods(base, { diningHall, meal: 'all' });
  const visible = filterFoods(inHall, { diningHall: 'all', meal });

  return {
    visible,
    counts: countByMeal(inHall),
    showBanner: restrictions.length > 0,
    filtersActive,
    restrictionLabels: DIETARY_RESTRICTION_OPTIONS.filter((o) => restrictions.includes(o.id)).map(
      (o) => o.label,
    ),
    hiddenCount: dietary.hiddenCount,
    emptyBecauseOfDiet:
      filtersActive && visible.length === 0 && filterFoods(foods, { diningHall, meal }).length > 0,
  };
}

/**
 * Loads saved dietary restrictions for the Menu tab. A failure returns no
 * restrictions, so a preference error never blocks the menu.
 */
export async function loadMenuRestrictions(
  load: () => Promise<Pick<FoodPreferencesState, 'dietaryRestrictions'>>,
): Promise<DietaryRestrictionId[]> {
  try {
    const prefs = await load();
    return [...prefs.dietaryRestrictions];
  } catch {
    return [];
  }
}
