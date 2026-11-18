import assert from 'node:assert/strict';
import test from 'node:test';

import { flagMissingValues, formatTotal } from './missing-flags';
import type { DailyTotals } from './totals';

function totals(overrides: Partial<DailyTotals> = {}): DailyTotals {
  return {
    entryCount: 4,
    calories: { amount: 1500, missingCount: 0 },
    protein: { amount: 80, missingCount: 0 },
    carbohydrate: { amount: 150, missingCount: 0 },
    fat: { amount: 50, missingCount: 0 },
    ...overrides,
  };
}

test('S3-2.2 reports no flags when every food has data', () => {
  assert.deepEqual(flagMissingValues(totals()), { complete: true, flags: [] });
  assert.deepEqual(flagMissingValues(totals({ entryCount: 0 })), { complete: true, flags: [] });
});

test('S3-2.2 flags only the nutrients that have missing data', () => {
  const report = flagMissingValues(totals({ protein: { amount: 40, missingCount: 2 } }));

  assert.equal(report.complete, false);
  assert.deepEqual(report.flags, [
    { nutrient: 'protein', missingCount: 2, message: '2 foods have no protein data' },
  ]);
});

test('S3-2.2 words each message for one food or several, with the right nutrient name', () => {
  const report = flagMissingValues(
    totals({
      calories: { amount: 900, missingCount: 1 },
      protein: { amount: 40, missingCount: 3 },
      carbohydrate: { amount: 90, missingCount: 2 },
      fat: { amount: 30, missingCount: 1 },
    }),
  );

  assert.deepEqual(
    report.flags.map((flag) => flag.message),
    [
      '1 food has no calorie data',
      '3 foods have no protein data',
      '2 foods have no carb data',
      '1 food has no fat data',
    ],
  );
});

test('S3-2.2 lists flags in the order calories, protein, carbohydrate, fat', () => {
  const report = flagMissingValues(
    totals({
      fat: { amount: 30, missingCount: 1 },
      calories: { amount: 900, missingCount: 1 },
      carbohydrate: { amount: 90, missingCount: 1 },
    }),
  );

  assert.deepEqual(
    report.flags.map((flag) => flag.nutrient),
    ['calories', 'carbohydrate', 'fat'],
  );
});

test('S3-2.2 shows the plain amount when nothing is missing, including a real zero', () => {
  assert.equal(formatTotal(totals(), 'calories'), '1500');
  assert.equal(formatTotal(totals({ protein: { amount: 80.5, missingCount: 0 } }), 'protein'), '80.5');
  assert.equal(formatTotal(totals({ fat: { amount: 0, missingCount: 0 } }), 'fat'), '0');
  assert.equal(formatTotal(totals({ entryCount: 0, calories: { amount: 0, missingCount: 0 } }), 'calories'), '0');
});

test('S3-2.2 adds a plus sign when some foods are missing data', () => {
  const t = totals({ protein: { amount: 40, missingCount: 2 } });
  assert.equal(formatTotal(t, 'protein'), '40+');
  assert.equal(formatTotal(t, 'calories'), '1500');
});

test('S3-2.2 shows a dash, never zero, when every logged food is missing data', () => {
  const t = totals({ entryCount: 3, protein: { amount: 0, missingCount: 3 } });
  assert.equal(formatTotal(t, 'protein'), '—');
});

test('S3-2.2 does not change the totals it is given', () => {
  const t = totals({ protein: { amount: 40, missingCount: 2 } });
  const snapshot = structuredClone(t);

  flagMissingValues(t);
  formatTotal(t, 'protein');

  assert.deepEqual(t, snapshot);
});