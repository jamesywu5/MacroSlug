import {
  sanitizeLoadedPreferences,
  STORAGE_KEY_FOOD_PREFERENCES,
  type FoodPreferencesState,
} from './types';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

type FoodPreferencesInput = Pick<FoodPreferencesState, 'dietaryRestrictions' | 'foodPreferences'>;

export function createFoodPreferencesStorage(storage: KeyValueStorage) {
  async function loadFoodPreferences(): Promise<FoodPreferencesState> {
    const storedPreferences = await storage.getItem(STORAGE_KEY_FOOD_PREFERENCES);
    if (storedPreferences === null) {
      return sanitizeLoadedPreferences(null);
    }

    try {
      const parsed: unknown = JSON.parse(storedPreferences);
      return sanitizeLoadedPreferences(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return sanitizeLoadedPreferences(null);
      }
      throw error;
    }
  }

  async function saveFoodPreferences(
    preferences: FoodPreferencesInput,
  ): Promise<FoodPreferencesState> {
    const savedPreferences = sanitizeLoadedPreferences({
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
    await storage.setItem(
      STORAGE_KEY_FOOD_PREFERENCES,
      JSON.stringify(savedPreferences),
    );
    return savedPreferences;
  }

  return { loadFoodPreferences, saveFoodPreferences };
}
