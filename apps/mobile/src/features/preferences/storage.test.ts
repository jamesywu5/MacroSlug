import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFoodPreferencesStorage,
  type KeyValueStorage,
} from './storage-core';
import { DEFAULT_FOOD_PREFERENCES, STORAGE_KEY_FOOD_PREFERENCES } from './types';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getError: Error | undefined;
  setError: Error | undefined;

  async getItem(key: string): Promise<string | null> {
    if (this.getError) {
      throw this.getError;
    }
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.setError) {
      throw this.setError;
    }
    this.values.set(key, value);
  }
}

test('loads defaults when no preferences are saved', async () => {
  const storage = new MemoryStorage();
  const preferences = createFoodPreferencesStorage(storage);

  assert.deepEqual(await preferences.loadFoodPreferences(), DEFAULT_FOOD_PREFERENCES);
});

test('loads and sanitizes saved preferences using the versioned key', async () => {
  const storage = new MemoryStorage();
  storage.values.set(
    STORAGE_KEY_FOOD_PREFERENCES,
    JSON.stringify({
      dietaryRestrictions: ['vegetarian', 'unknown'],
      foodPreferences: ['high-protein'],
      updatedAt: '2026-11-09T20:00:00.000Z',
    }),
  );
  const preferences = createFoodPreferencesStorage(storage);

  assert.deepEqual(await preferences.loadFoodPreferences(), {
    dietaryRestrictions: ['vegetarian'],
    foodPreferences: ['high-protein'],
    updatedAt: '2026-11-09T20:00:00.000Z',
  });
});

test('returns defaults for malformed saved JSON', async () => {
  const storage = new MemoryStorage();
  storage.values.set(STORAGE_KEY_FOOD_PREFERENCES, '{bad json');
  const preferences = createFoodPreferencesStorage(storage);

  assert.deepEqual(await preferences.loadFoodPreferences(), DEFAULT_FOOD_PREFERENCES);
});

test('saves sanitized selections with an ISO timestamp', async () => {
  const storage = new MemoryStorage();
  const preferences = createFoodPreferencesStorage(storage);

  const saved = await preferences.saveFoodPreferences({
    dietaryRestrictions: ['vegan', 'vegan'],
    foodPreferences: ['lower-carb'],
  });

  assert.deepEqual(saved.dietaryRestrictions, ['vegan']);
  assert.deepEqual(saved.foodPreferences, ['lower-carb']);
  assert.ok(Number.isFinite(Date.parse(saved.updatedAt)));
  assert.equal(new Date(saved.updatedAt).toISOString(), saved.updatedAt);
  assert.deepEqual(
    JSON.parse(storage.values.get(STORAGE_KEY_FOOD_PREFERENCES) ?? 'null'),
    saved,
  );
});

test('propagates storage read and write failures', async () => {
  const storage = new MemoryStorage();
  const preferences = createFoodPreferencesStorage(storage);
  const readError = new Error('read failed');
  storage.getError = readError;

  await assert.rejects(preferences.loadFoodPreferences(), (error) => error === readError);

  const writeError = new Error('write failed');
  storage.getError = undefined;
  storage.setError = writeError;
  await assert.rejects(
    preferences.saveFoodPreferences({ dietaryRestrictions: [], foodPreferences: [] }),
    (error) => error === writeError,
  );
});
