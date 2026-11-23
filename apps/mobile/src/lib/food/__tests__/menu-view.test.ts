/// <reference types="jest" />

import { filterFoods, normalizeFoodRow } from '../filter-foods';
import { buildMenuView, loadMenuRestrictions, type MenuViewInput } from '../menu-view';
import { MOCK_FOOD_ROWS } from '../mock-foods';
import { DINING_HALLS, MEAL_TYPES } from '../types';

const foods = MOCK_FOOD_ROWS.map(normalizeFoodRow);

function view(overrides: Partial<MenuViewInput> = {}) {
  return buildMenuView({
    foods,
    restrictions: [],
    showAll: false,
    diningHall: 'all',
    meal: 'Lunch',
    ...overrides,
  });
}

describe('buildMenuView', () => {
  describe('with no restrictions saved', () => {
    const halls = ['all' as const, ...DINING_HALLS.map((h) => h.id)];

    it.each(halls.flatMap((hall) => MEAL_TYPES.map((meal) => [hall, meal] as const)))(
      'shows the same items as before for %s / %s',
      (diningHall, meal) => {
        const result = view({ diningHall, meal });
        expect(result.visible).toEqual(filterFoods(foods, { diningHall, meal }));
      },
    );

    it('hides the banner and reports nothing hidden', () => {
      const result = view();
      expect(result.showBanner).toBe(false);
      expect(result.filtersActive).toBe(false);
      expect(result.hiddenCount).toBe(0);
      expect(result.restrictionLabels).toEqual([]);
    });
  });

  describe('with Vegan saved', () => {
    it('only lists vegan items', () => {
      const result = view({ restrictions: ['vegan'], meal: 'Dinner' });
      expect(result.visible.map((f) => f.name)).toEqual([
        'Jasmine Rice',
        'Roasted Broccoli',
        'Spaghetti Marinara',
        'Steamed Edamame',
        'Tofu Stir Fry',
      ]);
    });

    it('shows the banner with the restriction and the hidden count across the whole menu', () => {
      const result = view({ restrictions: ['vegan'] });
      expect(result.showBanner).toBe(true);
      expect(result.filtersActive).toBe(true);
      expect(result.restrictionLabels).toEqual(['Vegan']);
      expect(result.hiddenCount).toBe(14);
    });

    it('counts only matching items per meal', () => {
      expect(view({ restrictions: ['vegan'] }).counts).toEqual({
        Breakfast: 1,
        Lunch: 4,
        Dinner: 5,
      });
    });

    it('counts per meal within the selected hall', () => {
      expect(view({ restrictions: ['vegan'], diningHall: 'Crown/Merrill' }).counts).toEqual({
        Breakfast: 0,
        Lunch: 1,
        Dinner: 2,
      });
    });
  });

  it('lists restriction labels in catalog order', () => {
    expect(view({ restrictions: ['kosher', 'halal', 'vegan'] }).restrictionLabels).toEqual([
      'Vegan',
      'Halal',
      'Kosher',
    ]);
  });

  it('"Show all" lists the unfiltered menu but keeps the banner and hidden count', () => {
    const result = view({ restrictions: ['vegan'], showAll: true, meal: 'Dinner' });
    expect(result.visible).toEqual(filterFoods(foods, { diningHall: 'all', meal: 'Dinner' }));
    expect(result.filtersActive).toBe(false);
    expect(result.showBanner).toBe(true);
    expect(result.hiddenCount).toBe(14);
    expect(result.counts).toEqual({ Breakfast: 6, Lunch: 9, Dinner: 9 });
  });

  describe('emptyBecauseOfDiet', () => {
    it('is true when the meal has items but the restrictions hide all of them', () => {
      // Nine/Ten dinner only has Beef Tacos.
      const result = view({ restrictions: ['vegan'], diningHall: 'Nine/Ten', meal: 'Dinner' });
      expect(result.visible).toEqual([]);
      expect(result.emptyBecauseOfDiet).toBe(true);
    });

    it('is false when the meal has nothing listed at all', () => {
      const result = view({ restrictions: ['vegan'], diningHall: 'Porter/Kresge', meal: 'Breakfast' });
      expect(result.visible).toEqual([]);
      expect(result.emptyBecauseOfDiet).toBe(false);
    });

    it('is false while "Show all" is on', () => {
      const result = view({
        restrictions: ['vegan'],
        showAll: true,
        diningHall: 'Nine/Ten',
        meal: 'Dinner',
      });
      expect(result.emptyBecauseOfDiet).toBe(false);
    });
  });

  it('does not change the foods array', () => {
    const before = [...foods];
    view({ restrictions: ['vegetarian', 'halal'] });
    expect(foods).toEqual(before);
  });
});

describe('loadMenuRestrictions', () => {
  it('returns the saved dietary restrictions', async () => {
    await expect(
      loadMenuRestrictions(async () => ({ dietaryRestrictions: ['vegan', 'halal'] })),
    ).resolves.toEqual(['vegan', 'halal']);
  });

  it('returns no restrictions when loading fails, so the menu shows unfiltered', async () => {
    await expect(
      loadMenuRestrictions(async () => {
        throw new Error('storage unavailable');
      }),
    ).resolves.toEqual([]);
  });
});
