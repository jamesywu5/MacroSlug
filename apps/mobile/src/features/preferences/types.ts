export const DIETARY_RESTRICTION_IDS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'halal',
  'kosher',
] as const;

export type DietaryRestrictionId = (typeof DIETARY_RESTRICTION_IDS)[number];

export const FOOD_PREFERENCE_IDS = ['high-protein', 'lower-carb'] as const;

export type FoodPreferenceId = (typeof FOOD_PREFERENCE_IDS)[number];

export interface PreferenceOption<T extends string> {
  id: T;
  label: string;
}

export const DIETARY_RESTRICTION_OPTIONS: PreferenceOption<DietaryRestrictionId>[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export const FOOD_PREFERENCE_OPTIONS: PreferenceOption<FoodPreferenceId>[] = [
  { id: 'high-protein', label: 'High protein' },
  { id: 'lower-carb', label: 'Lower carb' },
];

export interface FoodPreferencesState {
  dietaryRestrictions: DietaryRestrictionId[];
  foodPreferences: FoodPreferenceId[];
  updatedAt: string;
}

export const DEFAULT_FOOD_PREFERENCES: FoodPreferencesState = {
  dietaryRestrictions: [],
  foodPreferences: [],
  updatedAt: '',
};

export const STORAGE_KEY_FOOD_PREFERENCES = '@app:food_preferences_v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function filterValidIds<T extends string>(value: unknown, ids: readonly T[]): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set<string>(ids);
  return Array.from(
    new Set(value.filter((id): id is T => typeof id === 'string' && validIds.has(id))),
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match || !Number.isFinite(Date.parse(value))) {
    return false;
  }

  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(Number(hour), Number(minute), Number(second));

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day) &&
    Number(hour) < 24 &&
    Number(minute) < 60 &&
    Number(second) < 60 &&
    (offsetHour === undefined ||
      (Number(offsetHour) < 24 && Number(offsetMinute) < 60))
  );
}

export function sanitizeLoadedPreferences(data: unknown): FoodPreferencesState {
  if (!isRecord(data)) {
    return {
      ...DEFAULT_FOOD_PREFERENCES,
      dietaryRestrictions: [],
      foodPreferences: [],
    };
  }

  return {
    dietaryRestrictions: filterValidIds(data.dietaryRestrictions, DIETARY_RESTRICTION_IDS),
    foodPreferences: filterValidIds(data.foodPreferences, FOOD_PREFERENCE_IDS),
    updatedAt: isIsoTimestamp(data.updatedAt) ? data.updatedAt : '',
  };
}
