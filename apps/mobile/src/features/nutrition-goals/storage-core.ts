import {
  STORAGE_KEY_NUTRITION_GOALS,
  type NutritionGoalKey,
  type NutritionGoals,
  type NutritionGoalsInputState,
  type StoredNutritionGoals,
} from './types';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const NUTRITION_GOAL_KEYS: readonly NutritionGoalKey[] = ['calories', 'protein', 'carbs', 'fat'];

function noGoals(): NutritionGoals {
  return { calories: null, protein: null, carbs: null, fat: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Same rules as `validateNutritionGoal`, applied to an already-parsed number. */
function isValidGoal(field: NutritionGoalKey, value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    (field !== 'calories' || Number.isInteger(value))
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

/** Keeps each valid goal and turns anything else into `null`. Never throws. */
export function sanitizeStoredNutritionGoals(data: unknown): StoredNutritionGoals {
  if (!isRecord(data)) {
    return { goals: noGoals(), updatedAt: '' };
  }

  const stored = isRecord(data.goals) ? data.goals : {};
  const goals = noGoals();
  for (const key of NUTRITION_GOAL_KEYS) {
    const value = stored[key];
    goals[key] = isValidGoal(key, value) ? value : null;
  }

  return { goals, updatedAt: isIsoTimestamp(data.updatedAt) ? data.updatedAt : '' };
}

/** Converts saved goals into form strings. Unset goals become blank fields. */
export function goalsToInputState(goals: NutritionGoals): NutritionGoalsInputState {
  const input = { calories: '', protein: '', carbs: '', fat: '' };
  for (const key of NUTRITION_GOAL_KEYS) {
    const value = goals[key];
    input[key] = value === null ? '' : String(value);
  }
  return input;
}

export function createNutritionGoalsStorage(storage: KeyValueStorage) {
  async function loadNutritionGoals(): Promise<StoredNutritionGoals> {
    const raw = await storage.getItem(STORAGE_KEY_NUTRITION_GOALS);
    if (raw === null) {
      return sanitizeStoredNutritionGoals(null);
    }

    try {
      return sanitizeStoredNutritionGoals(JSON.parse(raw));
    } catch (error) {
      if (error instanceof SyntaxError) {
        return sanitizeStoredNutritionGoals(null);
      }
      throw error;
    }
  }

  async function saveNutritionGoals(goals: NutritionGoals): Promise<StoredNutritionGoals> {
    const toSave = noGoals();
    for (const key of NUTRITION_GOAL_KEYS) {
      const value = goals[key];
      if (value !== null && !isValidGoal(key, value)) {
        throw new RangeError(`Invalid ${key} goal: ${String(value)}`);
      }
      toSave[key] = value;
    }

    const saved: StoredNutritionGoals = { goals: toSave, updatedAt: new Date().toISOString() };
    await storage.setItem(STORAGE_KEY_NUTRITION_GOALS, JSON.stringify(saved));
    return saved;
  }

  return { loadNutritionGoals, saveNutritionGoals };
}
