import type { FoodItem } from '../../lib/food/types';

/**
 * One food the student logged. The fields match a row of
 * `public.daily_log_entries` and the `GET /api/log-entries` response (S3-1.2),
 * so entries can move to the API once the app has sign-in.
 *
 * Written so log entries do not reset after a menu change. Also writte
 */
export interface DailyLogEntry {
  id: string;
  food_name: string;
  /** Servings eaten, above 0. Multiply the per-serving values by this. */
  serving_quantity: number;
  /** local calendar day*/
  consumption_date: string;
  calories: number | null;
  protein: number | null;
  carbohydrate: number | null;
  fat: number | null;
  created_at: string;
  source_food_id: number | null;
}

export const MIN_SERVINGS = 0.5;
export const MAX_SERVINGS = 10;
export const SERVING_STEP = 0.5;
export const DEFAULT_SERVINGS = 1;

/** true for a whole or 1/2 serving from 0.5 to 10. */
export function isValidServingQuantity(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_SERVINGS &&
    value <= MAX_SERVINGS &&
    Number.isInteger(value / SERVING_STEP)
  );
}

/**
 * stays within range and rounds to nearest half
 */
export function stepServingQuantity(current: number, direction: 1 | -1): number {
  const base = Number.isFinite(current)
    ? Math.round(current / SERVING_STEP) * SERVING_STEP
    : DEFAULT_SERVINGS;
  const next = base + direction * SERVING_STEP;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, next));
}

/** "1 serving", "1.5 servings", "0.5 servings". */
export function formatServings(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'serving' : 'servings'}`;
}

/**
 * uses local device time zone
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export type ScaledNutrition = {
  calories: number | null;
  protein: number | null;
  carbohydrate: number | null;
  fat: number | null;
};

/** per-serving values times the quantity, rounded to 0.1. Unknown values stay `null`. */
export function scaleNutrition(
  perServing: Pick<FoodItem, 'calories' | 'protein' | 'carbs' | 'fat'>,
  quantity: number,
): ScaledNutrition {
  const scale = (value: number | null) => (value === null ? null : roundToTenth(value * quantity));
  return {
    calories: scale(perServing.calories),
    protein: scale(perServing.protein),
    carbohydrate: scale(perServing.carbs),
    fat: scale(perServing.fat),
  };
}

/**
 * builds a log entry from a menu item.
 *
 * @throws RangeError if the quantity is not a half or whole serving from 0.5 to 10.
 */
export function createLogEntry(
  food: FoodItem,
  quantity: number,
  options: { now: Date; id: string },
): DailyLogEntry {
  if (!isValidServingQuantity(quantity)) {
    throw new RangeError(
      `serving_quantity must be a multiple of ${SERVING_STEP} from ${MIN_SERVINGS} to ${MAX_SERVINGS}, got ${String(quantity)}`,
    );
  }
  return {
    id: options.id,
    food_name: food.name.trim() || 'Unnamed item',
    serving_quantity: quantity,
    consumption_date: toLocalDateString(options.now),
    calories: food.calories,
    protein: food.protein,
    carbohydrate: food.carbs,
    fat: food.fat,
    created_at: options.now.toISOString(),
    source_food_id: food.id,
  };
}

/** "Added 2 servings of _______ to today's log". */
export function confirmationMessage(
  entry: Pick<DailyLogEntry, 'food_name' | 'serving_quantity'>,
): string {
  return `Added ${formatServings(entry.serving_quantity)} of ${entry.food_name} to today's log`;
}

function isNutrient(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

/**
 * checks a value loaded from storage. returns the entry if every field is
 * usable, otherwise `null`, so one damaged entry can't break the whole log.
 */
export function sanitizeLogEntry(value: unknown): DailyLogEntry | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const quantity = v.serving_quantity;
  if (
    typeof v.id !== 'string' ||
    typeof v.food_name !== 'string' ||
    !v.food_name.trim() ||
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    typeof v.consumption_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.consumption_date) ||
    typeof v.created_at !== 'string' ||
    !isNutrient(v.calories ?? null) ||
    !isNutrient(v.protein ?? null) ||
    !isNutrient(v.carbohydrate ?? null) ||
    !isNutrient(v.fat ?? null)
  ) {
    return null;
  }
  return {
    id: v.id,
    food_name: v.food_name,
    serving_quantity: quantity,
    consumption_date: v.consumption_date,
    calories: (v.calories as number | null) ?? null,
    protein: (v.protein as number | null) ?? null,
    carbohydrate: (v.carbohydrate as number | null) ?? null,
    fat: (v.fat as number | null) ?? null,
    created_at: v.created_at,
    source_food_id: typeof v.source_food_id === 'number' ? v.source_food_id : null,
  };
}
