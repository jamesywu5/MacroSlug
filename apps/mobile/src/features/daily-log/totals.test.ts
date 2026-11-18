import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateDailyTotals, type LogEntry } from './totals';

function entry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    serving_quantity: 1,
    calories: 100,
    protein: 10,
    carbohydrate: 20,
    fat: 5,
    ...overrides,
  };
}

test('S3-2.1 sums each nutrient across entries and counts the entries', () => {
  const totals = calculateDailyTotals([
    entry({ calories: 200, protein: 10, carbohydrate: 30, fat: 5 }),
    entry({ calories: 350, protein: 25, carbohydrate: 0, fat: 12 }),
    entry({ calories: 50, protein: 1, carbohydrate: 8, fat: 0 }),
  ]);

  assert.deepEqual(totals, {
    entryCount: 3,
    calories: { amount: 600, missingCount: 0 },
    protein: { amount: 36, missingCount: 0 },
    carbohydrate: { amount: 38, missingCount: 0 },
    fat: { amount: 17, missingCount: 0 },
  });
});

test('S3-2.1 multiplies by fractional serving quantities and rounds to one decimal', () => {
  const half = calculateDailyTotals([entry({ serving_quantity: 0.5, calories: 250, protein: 7 })]);
  assert.equal(half.calories.amount, 125);
  assert.equal(half.protein.amount, 3.5);

  const floatTrap = calculateDailyTotals([entry({ serving_quantity: 3, protein: 0.1 })]);
  assert.equal(floatTrap.protein.amount, 0.3);

  const rounded = calculateDailyTotals([entry({ serving_quantity: 1.5, fat: 3.33 })]);
  assert.equal(rounded.fat.amount, 5);
});

test('S3-2.1 leaves unknown values out of the total and counts them as missing', () => {
  const totals = calculateDailyTotals([
    entry({ calories: 100, protein: null }),
    entry({ calories: 200, protein: undefined }),
    entry({ calories: 300, protein: 12 }),
    entry({ calories: -5, protein: Number.NaN, carbohydrate: Number.POSITIVE_INFINITY }),
  ]);

  assert.deepEqual(totals.protein, { amount: 12, missingCount: 3 });
  assert.deepEqual(totals.calories, { amount: 600, missingCount: 1 });
  // Missing protein did not stop the same entries' other nutrients from being totaled.
  assert.deepEqual(totals.carbohydrate, { amount: 60, missingCount: 1 });
  assert.deepEqual(totals.fat, { amount: 20, missingCount: 0 });
});

test('S3-2.1 treats a value of exactly 0 as known, not missing', () => {
  const totals = calculateDailyTotals([entry({ carbohydrate: 0 }), entry({ carbohydrate: 0 })]);
  assert.deepEqual(totals.carbohydrate, { amount: 0, missingCount: 0 });
});

test('S3-2.1 returns zeros for an empty day', () => {
  assert.deepEqual(calculateDailyTotals([]), {
    entryCount: 0,
    calories: { amount: 0, missingCount: 0 },
    protein: { amount: 0, missingCount: 0 },
    carbohydrate: { amount: 0, missingCount: 0 },
    fat: { amount: 0, missingCount: 0 },
  });
});

test('S3-2.1 throws a RangeError for a serving quantity that is not above 0', () => {
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => calculateDailyTotals([entry({ serving_quantity: bad })]), RangeError);
  }
  // One bad entry fails the whole calculation instead of being silently skipped.
  assert.throws(() => calculateDailyTotals([entry(), entry({ serving_quantity: 0 })]), RangeError);
});

test('S3-2.1 does not change its input and reflects added, edited, and removed entries', () => {
  const entries = [entry({ calories: 100 }), entry({ calories: 200 })];
  const snapshot = structuredClone(entries);

  assert.equal(calculateDailyTotals(entries).calories.amount, 300);
  assert.deepEqual(entries, snapshot);

  const added = [...entries, entry({ calories: 50 })];
  assert.equal(calculateDailyTotals(added).calories.amount, 350);

  const edited = [entries[0], { ...entries[1], serving_quantity: 2 }];
  assert.equal(calculateDailyTotals(edited).calories.amount, 500);

  const removed = entries.slice(1);
  assert.equal(calculateDailyTotals(removed).calories.amount, 200);
  assert.equal(calculateDailyTotals(removed).entryCount, 1);
});