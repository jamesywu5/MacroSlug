import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  createNutritionGoalsStorage,
  goalsToInputState,
  sanitizeStoredNutritionGoals,
  type KeyValueStorage,
} from './storage-core';
import { STORAGE_KEY_NUTRITION_GOALS, type NutritionGoals } from './types';
import { validateNutritionGoals } from './validation';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  setCalls = 0;
  getError: Error | undefined;
  setError: Error | undefined;

  async getItem(key: string): Promise<string | null> {
    if (this.getError) {
      throw this.getError;
    }
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.setCalls += 1;
    if (this.setError) {
      throw this.setError;
    }
    this.values.set(key, value);
  }
}

const NO_GOALS: NutritionGoals = { calories: null, protein: null, carbs: null, fat: null };
const SOME_GOALS: NutritionGoals = { calories: 2000, protein: 120.5, carbs: null, fat: 0 };

function setup() {
  const storage = new MemoryStorage();
  return { storage, goals: createNutritionGoalsStorage(storage) };
}

function storeRaw(storage: MemoryStorage, value: unknown) {
  storage.values.set(STORAGE_KEY_NUTRITION_GOALS, JSON.stringify(value));
}

function assertIsoTimestamp(value: string) {
  assert.ok(Number.isFinite(Date.parse(value)), `${value} should parse`);
  assert.equal(new Date(value).toISOString(), value);
}

describe('loadNutritionGoals', () => {
  test('returns no goals when nothing is saved', async () => {
    const { goals } = setup();
    assert.deepEqual(await goals.loadNutritionGoals(), { goals: NO_GOALS, updatedAt: '' });
  });

  test('returns no goals for malformed JSON', async () => {
    const { storage, goals } = setup();
    storage.values.set(STORAGE_KEY_NUTRITION_GOALS, '{bad json');
    assert.deepEqual(await goals.loadNutritionGoals(), { goals: NO_GOALS, updatedAt: '' });
  });

  for (const value of [null, 42, 'goals', [2000, 100], true]) {
    test(`returns no goals for non-object JSON ${JSON.stringify(value)}`, async () => {
      const { storage, goals } = setup();
      storeRaw(storage, value);
      assert.deepEqual(await goals.loadNutritionGoals(), { goals: NO_GOALS, updatedAt: '' });
    });
  }

  test('returns no goals when the goals property is not an object', async () => {
    const { storage, goals } = setup();
    storeRaw(storage, { goals: [2000], updatedAt: '2026-11-20T18:00:00.000Z' });
    assert.deepEqual(await goals.loadNutritionGoals(), {
      goals: NO_GOALS,
      updatedAt: '2026-11-20T18:00:00.000Z',
    });
  });

  test('keeps valid goals and drops each invalid one separately', async () => {
    const { storage, goals } = setup();
    storeRaw(storage, {
      goals: { calories: 1800.5, protein: '120', carbs: -10, fat: 65.5 },
      updatedAt: '2026-11-20T18:00:00.000Z',
    });
    assert.deepEqual(await goals.loadNutritionGoals(), {
      goals: { calories: null, protein: null, carbs: null, fat: 65.5 },
      updatedAt: '2026-11-20T18:00:00.000Z',
    });
  });

  test('treats missing goal fields as unset', async () => {
    const { storage, goals } = setup();
    storeRaw(storage, { goals: { protein: 90 }, updatedAt: '2026-11-20T18:00:00.000Z' });
    assert.deepEqual((await goals.loadNutritionGoals()).goals, { ...NO_GOALS, protein: 90 });
  });

  test('clears an invalid updatedAt', async () => {
    const { storage, goals } = setup();
    for (const updatedAt of ['yesterday', 12345, '2026-13-40T00:00:00.000Z', null]) {
      storeRaw(storage, { goals: { calories: 2000 }, updatedAt });
      const loaded = await goals.loadNutritionGoals();
      assert.equal(loaded.updatedAt, '', `updatedAt ${JSON.stringify(updatedAt)}`);
      assert.equal(loaded.goals.calories, 2000);
    }
  });

  test('throws storage read failures', async () => {
    const { storage, goals } = setup();
    const readError = new Error('read failed');
    storage.getError = readError;
    await assert.rejects(goals.loadNutritionGoals(), (error) => error === readError);
  });
});

describe('sanitizeStoredNutritionGoals', () => {
  test('rejects non-finite, negative, and non-number goals', () => {
    const result = sanitizeStoredNutritionGoals({
      goals: { calories: Infinity, protein: NaN, carbs: -0.5, fat: null },
    });
    assert.deepEqual(result.goals, NO_GOALS);
  });

  test('accepts zero for every goal', () => {
    const goals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    assert.deepEqual(sanitizeStoredNutritionGoals({ goals }).goals, goals);
  });
});

describe('saveNutritionGoals', () => {
  test('round-trips goals through the versioned key', async () => {
    const { storage, goals } = setup();

    const saved = await goals.saveNutritionGoals(SOME_GOALS);

    assert.deepEqual(saved.goals, SOME_GOALS);
    assertIsoTimestamp(saved.updatedAt);
    assert.deepEqual(
      JSON.parse(storage.values.get(STORAGE_KEY_NUTRITION_GOALS) ?? 'null'),
      saved
    );
    assert.deepEqual(await goals.loadNutritionGoals(), saved);
  });

  test('a new storage instance over the same data loads the saved goals', async () => {
    const { storage, goals } = setup();
    const saved = await goals.saveNutritionGoals(SOME_GOALS);

    const reopened = createNutritionGoalsStorage(storage);
    assert.deepEqual(await reopened.loadNutritionGoals(), saved);
  });

  test('saving every goal as null clears earlier goals', async () => {
    const { goals } = setup();
    await goals.saveNutritionGoals(SOME_GOALS);

    await goals.saveNutritionGoals(NO_GOALS);

    assert.deepEqual((await goals.loadNutritionGoals()).goals, NO_GOALS);
  });

  test('a later save replaces the earlier one', async () => {
    const { goals } = setup();
    await goals.saveNutritionGoals(SOME_GOALS);
    const next: NutritionGoals = { calories: 2500, protein: null, carbs: 300, fat: 70 };

    await goals.saveNutritionGoals(next);

    assert.deepEqual((await goals.loadNutritionGoals()).goals, next);
  });

  test('does not change its input', async () => {
    const { goals } = setup();
    const input = { ...SOME_GOALS };
    await goals.saveNutritionGoals(input);
    assert.deepEqual(input, SOME_GOALS);
  });

  const invalidGoals: [string, NutritionGoals][] = [
    ['negative protein', { ...NO_GOALS, protein: -1 }],
    ['decimal calories', { ...NO_GOALS, calories: 2000.5 }],
    ['NaN carbs', { ...NO_GOALS, carbs: NaN }],
    ['infinite fat', { ...NO_GOALS, fat: Infinity }],
    ['string calories', { ...NO_GOALS, calories: '2000' as unknown as number }],
  ];
  for (const [name, input] of invalidGoals) {
    test(`rejects ${name} and leaves stored goals unchanged`, async () => {
      const { storage, goals } = setup();
      const before = await goals.saveNutritionGoals(SOME_GOALS);
      const writesBefore = storage.setCalls;

      await assert.rejects(goals.saveNutritionGoals(input), RangeError);

      assert.equal(storage.setCalls, writesBefore);
      assert.deepEqual(await goals.loadNutritionGoals(), before);
    });
  }

  test('throws storage write failures', async () => {
    const { storage, goals } = setup();
    const writeError = new Error('write failed');
    storage.setError = writeError;
    await assert.rejects(goals.saveNutritionGoals(SOME_GOALS), (error) => error === writeError);
  });
});

describe('goalsToInputState', () => {
  test('turns numbers into strings and unset goals into blank fields', () => {
    assert.deepEqual(goalsToInputState(SOME_GOALS), {
      calories: '2000',
      protein: '120.5',
      carbs: '',
      fat: '0',
    });
  });

  test('does not change its input', () => {
    const input = { ...SOME_GOALS };
    goalsToInputState(input);
    assert.deepEqual(input, SOME_GOALS);
  });

  test('form strings validate back to the same goals', () => {
    for (const goals of [SOME_GOALS, NO_GOALS, { calories: 0, protein: 0.5, carbs: 250, fat: 70.25 }]) {
      assert.deepEqual(validateNutritionGoals(goalsToInputState(goals)), { ok: true, goals });
    }
  });
});
