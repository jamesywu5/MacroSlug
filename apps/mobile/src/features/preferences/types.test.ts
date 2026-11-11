import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FOOD_PREFERENCES,
  DIETARY_RESTRICTION_IDS,
  DIETARY_RESTRICTION_OPTIONS,
  FOOD_PREFERENCE_IDS,
  FOOD_PREFERENCE_OPTIONS,
  sanitizeLoadedPreferences,
  STORAGE_KEY_FOOD_PREFERENCES,
} from './types';

test('preference catalogs cover their stable IDs exactly once', () => {
  assert.deepEqual(
    DIETARY_RESTRICTION_OPTIONS.map((option) => option.id),
    DIETARY_RESTRICTION_IDS,
  );
  assert.deepEqual(FOOD_PREFERENCE_OPTIONS.map((option) => option.id), FOOD_PREFERENCE_IDS);
  assert.equal(new Set(DIETARY_RESTRICTION_IDS).size, DIETARY_RESTRICTION_IDS.length);
  assert.equal(new Set(FOOD_PREFERENCE_IDS).size, FOOD_PREFERENCE_IDS.length);
});

test('exports the versioned storage key and empty default', () => {
  assert.equal(STORAGE_KEY_FOOD_PREFERENCES, '@app:food_preferences_v1');
  assert.deepEqual(DEFAULT_FOOD_PREFERENCES, {
    dietaryRestrictions: [],
    foodPreferences: [],
    updatedAt: '',
  });
});

test('sanitizes valid IDs, removes unknown values and duplicates', () => {
  assert.deepEqual(
    sanitizeLoadedPreferences({
      dietaryRestrictions: ['vegan', 'invalid', 'vegan', 4, 'halal'],
      foodPreferences: ['lower-carb', null, 'high-protein', 'lower-carb'],
      updatedAt: '2026-11-09T20:00:00.000Z',
    }),
    {
      dietaryRestrictions: ['vegan', 'halal'],
      foodPreferences: ['lower-carb', 'high-protein'],
      updatedAt: '2026-11-09T20:00:00.000Z',
    },
  );
});

test('defaults malformed shapes and invalid fields independently', () => {
  assert.deepEqual(sanitizeLoadedPreferences(null), DEFAULT_FOOD_PREFERENCES);
  assert.deepEqual(sanitizeLoadedPreferences([]), DEFAULT_FOOD_PREFERENCES);
  assert.deepEqual(sanitizeLoadedPreferences('stored text'), DEFAULT_FOOD_PREFERENCES);
  assert.deepEqual(
    sanitizeLoadedPreferences({
      dietaryRestrictions: 'vegan',
      foodPreferences: { value: 'high-protein' },
      updatedAt: 'not-a-date',
    }),
    DEFAULT_FOOD_PREFERENCES,
  );
});

test('rejects impossible dates and timestamps without a timezone', () => {
  for (const updatedAt of [
    '2026-02-29T12:00:00Z',
    '2026-11-09T25:00:00Z',
    '2026-11-09T12:00:00',
    '2026-11-09T12:00:00+99:00',
  ]) {
    assert.equal(
      sanitizeLoadedPreferences({ updatedAt }).updatedAt,
      '',
      `expected ${updatedAt} to be rejected`,
    );
  }
});
