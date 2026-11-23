import assert from 'node:assert/strict';
import test from 'node:test';

import type { FoodItem } from '../../lib/food/types';

import { confirmationMessage } from './entries';
import { createDailyLogStorage, STORAGE_KEY_DAILY_LOG, type KeyValueStorage } from './storage-core';
import { calculateDailyTotals } from './totals';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  setError: Error | undefined;

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    // yield like real storage does, so overlapping saves can interleave.
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (this.setError) throw this.setError;
    this.values.set(key, value);
  }
}

function food(id: number, name: string, overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id,
    name,
    diningHall: 'Crown/Merrill',
    meal: 'Lunch',
    calories: 200,
    protein: 10,
    carbs: 20,
    fat: 5,
    allergens: [],
    missing: [],
    scrapedAt: '2026-11-23T08:00:00Z',
    ...overrides,
  };
}

function setup(start = new Date(2026, 10, 23, 12, 0)) {
  const storage = new MemoryStorage();
  let clock = start;
  let n = 0;
  const log = createDailyLogStorage(storage, {
    now: () => clock,
    makeId: () => `id-${++n}`,
  });
  return {
    storage,
    log,
    setTime(date: Date) {
      clock = date;
    },
  };
}

test('S3-1.4 add-to-log flow: add, reload, confirm, and total', async () => {
  const { log } = setup();

  const pizza = await log.addFoodToLog(food(1, 'Cheese Pizza', { calories: 290, protein: 12 }), 2);
  await log.addFoodToLog(food(2, 'Garden Salad', { calories: 70, protein: null }), 0.5);

  assert.equal(confirmationMessage(pizza), "Added 2 servings of Cheese Pizza to today's log");

  const today = await log.loadEntriesForDate();
  assert.deepEqual(
    today.map((e) => [e.food_name, e.serving_quantity]),
    [
      ['Cheese Pizza', 2],
      ['Garden Salad', 0.5],
    ],
  );

  const totals = calculateDailyTotals(today);
  assert.equal(totals.calories.amount, 290 * 2 + 70 * 0.5);
  assert.deepEqual(totals.protein, { amount: 24, missingCount: 1 });
});

test('S3-1.2 starts empty when nothing is saved', async () => {
  const { log } = setup();
  assert.deepEqual(await log.loadAllEntries(), []);
  assert.deepEqual(await log.loadEntriesForDate(), []);
});

test('S3-1.2 entries survive a new storage instance (app restart)', async () => {
  const { storage, log } = setup();
  await log.addFoodToLog(food(1, 'Oatmeal'), 1);

  const reopened = createDailyLogStorage(storage);
  const entries = await reopened.loadAllEntries();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].food_name, 'Oatmeal');
});

test('S3-1.2 keeps each day separate', async () => {
  const { log, setTime } = setup(new Date(2026, 10, 22, 19, 0));
  await log.addFoodToLog(food(1, 'Yesterday Tacos'), 1);
  setTime(new Date(2026, 10, 23, 8, 0));
  await log.addFoodToLog(food(2, 'Today Oatmeal'), 1);

  assert.deepEqual(
    (await log.loadEntriesForDate('2026-11-22')).map((e) => e.food_name),
    ['Yesterday Tacos'],
  );
  assert.deepEqual(
    (await log.loadEntriesForDate()).map((e) => e.food_name),
    ['Today Oatmeal'],
  );
});

test('S3-1.2 logging the same food twice makes two entries', async () => {
  const { log } = setup();
  await log.addFoodToLog(food(1, 'Rice'), 1);
  await log.addFoodToLog(food(1, 'Rice'), 1);
  const entries = await log.loadEntriesForDate();
  assert.equal(entries.length, 2);
  assert.notEqual(entries[0].id, entries[1].id);
});

test('S3-1.4 two quick adds both get saved', async () => {
  const { log } = setup();
  await Promise.all([
    log.addFoodToLog(food(1, 'Rice'), 1),
    log.addFoodToLog(food(2, 'Beans'), 1),
    log.addFoodToLog(food(3, 'Salsa'), 0.5),
  ]);
  assert.deepEqual((await log.loadAllEntries()).map((e) => e.food_name).sort(), [
    'Beans',
    'Rice',
    'Salsa',
  ]);
});

test('S3-1.4 an invalid quantity saves nothing', async () => {
  const { storage, log } = setup();
  await assert.rejects(log.addFoodToLog(food(1, 'Rice'), 0), RangeError);
  assert.equal(storage.values.has(STORAGE_KEY_DAILY_LOG), false);
});

test('S3-1.4 a failed save is reported and the next save still works', async () => {
  const { storage, log } = setup();
  storage.setError = new Error('disk full');
  await assert.rejects(log.addFoodToLog(food(1, 'Rice'), 1), /disk full/);

  storage.setError = undefined;
  await log.addFoodToLog(food(2, 'Beans'), 1);
  assert.deepEqual(
    (await log.loadAllEntries()).map((e) => e.food_name),
    ['Beans'],
  );
});

test('S3-1.2 recovers from damaged saved data', async () => {
  const { storage, log } = setup();
  storage.values.set(STORAGE_KEY_DAILY_LOG, '{not json');
  assert.deepEqual(await log.loadAllEntries(), []);

  storage.values.set(STORAGE_KEY_DAILY_LOG, JSON.stringify({ not: 'a list' }));
  assert.deepEqual(await log.loadAllEntries(), []);

  storage.values.set(
    STORAGE_KEY_DAILY_LOG,
    JSON.stringify([
      { broken: true },
      {
        id: 'ok',
        food_name: 'Rice',
        serving_quantity: 1,
        consumption_date: '2026-11-23',
        created_at: 'x',
      },
    ]),
  );
  assert.deepEqual(
    (await log.loadAllEntries()).map((e) => e.id),
    ['ok'],
  );

  await log.addFoodToLog(food(2, 'Beans'), 1);
  assert.deepEqual(
    (await log.loadAllEntries()).map((e) => e.food_name),
    ['Rice', 'Beans'],
  );
});
