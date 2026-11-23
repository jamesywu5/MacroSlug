import assert from 'node:assert/strict';
import test from 'node:test';

import type { FoodItem } from '../../lib/food/types';

import {
  confirmationMessage,
  createLogEntry,
  formatServings,
  isValidServingQuantity,
  sanitizeLogEntry,
  scaleNutrition,
  stepServingQuantity,
  toLocalDateString,
} from './entries';

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 7,
    name: 'Cheese Pizza',
    diningHall: 'Porter/Kresge',
    meal: 'Dinner',
    calories: 290,
    protein: 12,
    carbs: 35,
    fat: 11,
    allergens: ['gluten', 'milk'],
    missing: [],
    scrapedAt: '2026-11-23T08:00:00Z',
    ...overrides,
  };
}

const NOON = new Date(2026, 10, 23, 12, 0);

//Some tests were AI assisted 

test('S3-1.3 accepts whole and half servings from 0.5 to 10', () => {
  for (const q of [0.5, 1, 1.5, 2, 9.5, 10])
    assert.equal(isValidServingQuantity(q), true, String(q));
  for (const q of [0, -1, 0.25, 1.3, 10.5, 11, Number.NaN, Number.POSITIVE_INFINITY, '1', null]) {
    assert.equal(isValidServingQuantity(q), false, String(q));
  }
});

test('S3-1.3 steps by half a serving and stops at 0.5 and 10', () => {
  assert.equal(stepServingQuantity(1, 1), 1.5);
  assert.equal(stepServingQuantity(1, -1), 0.5);
  assert.equal(stepServingQuantity(0.5, -1), 0.5);
  assert.equal(stepServingQuantity(10, 1), 10);
  assert.equal(stepServingQuantity(9.5, 1), 10);
});

test('S3-1.3 snaps an off-step value to the nearest half before stepping', () => {
  assert.equal(stepServingQuantity(1.3, 1), 2);
  assert.equal(stepServingQuantity(1.2, -1), 0.5);
  assert.equal(stepServingQuantity(Number.NaN, 1), 1.5);
});

test('S3-1.3 formats singular and plural servings', () => {
  assert.equal(formatServings(1), '1 serving');
  assert.equal(formatServings(0.5), '0.5 servings');
  assert.equal(formatServings(2), '2 servings');
});

test('S3-1.3 scales nutrition by quantity and keeps unknown values unknown', () => {
  assert.deepEqual(scaleNutrition(food(), 1.5), {
    calories: 435,
    protein: 18,
    carbohydrate: 52.5,
    fat: 16.5,
  });
  assert.deepEqual(scaleNutrition(food({ protein: null, fat: 0 }), 2), {
    calories: 580,
    protein: null,
    carbohydrate: 70,
    fat: 0,
  });
  assert.equal(scaleNutrition(food({ protein: 0.1 }), 3).protein, 0.3);
});

test('S3-1.2 builds an entry with the food, quantity, local date and per-serving snapshot', () => {
  const entry = createLogEntry(food(), 2, { now: NOON, id: 'a' });
  assert.deepEqual(entry, {
    id: 'a',
    food_name: 'Cheese Pizza',
    serving_quantity: 2,
    consumption_date: '2026-11-23',
    calories: 290,
    protein: 12,
    carbohydrate: 35,
    fat: 11,
    created_at: NOON.toISOString(),
    source_food_id: 7,
  });
});

test('S3-1.2 keeps unknown nutrition as null and true zeros as 0', () => {
  const entry = createLogEntry(food({ calories: null, protein: 0, carbs: null, fat: 0 }), 1, {
    now: NOON,
    id: 'a',
  });
  assert.equal(entry.calories, null);
  assert.equal(entry.protein, 0);
  assert.equal(entry.carbohydrate, null);
  assert.equal(entry.fat, 0);
});

test('S3-1.2 rejects invalid quantities', () => {
  for (const q of [0, -1, 0.25, 11, Number.NaN]) {
    assert.throws(() => createLogEntry(food(), q, { now: NOON, id: 'a' }), RangeError);
  }
});

test('S3-1.2 trims the food name and replaces a blank one', () => {
  assert.equal(
    createLogEntry(food({ name: '  Tacos ' }), 1, { now: NOON, id: 'a' }).food_name,
    'Tacos',
  );
  assert.equal(
    createLogEntry(food({ name: '  ' }), 1, { now: NOON, id: 'a' }).food_name,
    'Unnamed item',
  );
});

test('S3-1.2 uses the local day, not the UTC day', () => {
  assert.equal(toLocalDateString(new Date(2026, 10, 23, 23, 30)), '2026-11-23');
  assert.equal(toLocalDateString(new Date(2026, 10, 24, 0, 0)), '2026-11-24');
  assert.equal(toLocalDateString(new Date(2026, 0, 5, 9, 0)), '2026-01-05');
});

test('S3-1.4 confirmation names the quantity and the food', () => {
  assert.equal(
    confirmationMessage({ food_name: 'Cheese Pizza', serving_quantity: 2 }),
    "Added 2 servings of Cheese Pizza to today's log",
  );
  assert.equal(
    confirmationMessage({ food_name: 'Oatmeal', serving_quantity: 1 }),
    "Added 1 serving of Oatmeal to today's log",
  );
});

test('S3-1.2 sanitizes stored entries and drops damaged ones', () => {
  const good = createLogEntry(food(), 1, { now: NOON, id: 'a' });
  assert.deepEqual(sanitizeLogEntry(good), good);
  assert.deepEqual(sanitizeLogEntry({ ...good, calories: undefined, source_food_id: 'x' }), {
    ...good,
    calories: null,
    source_food_id: null,
  });
  for (const bad of [
    null,
    'entry',
    { ...good, id: 3 },
    { ...good, food_name: ' ' },
    { ...good, serving_quantity: 0 },
    { ...good, consumption_date: '11/23/2026' },
    { ...good, protein: -2 },
    { ...good, fat: '5' },
  ]) {
    assert.equal(sanitizeLogEntry(bad), null);
  }
});
