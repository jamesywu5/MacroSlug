export const NUTRIENTS = ['calories', 'protein', 'carbohydrate', 'fat'] as const;

export type Nutrient = (typeof NUTRIENTS)[number];

/** One logged food, using the field names returned by GET /api/log-entries. */
export interface LogEntry {
  serving_quantity: number;
  calories?: number | null;
  protein?: number | null;
  carbohydrate?: number | null;
  fat?: number | null;
}

export interface NutrientTotal {
  /** Sum of (per-serving value x serving quantity) over entries where the value is known. */
  amount: number;
  /** How many entries had no usable value for this nutrient and are NOT included in `amount`. */
  missingCount: number;
}

export interface DailyTotals {
  entryCount: number;
  calories: NutrientTotal;
  protein: NutrientTotal;
  carbohydrate: NutrientTotal;
  fat: NutrientTotal;
}

function isKnown(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Adds up a day's log entries. Unknown nutrition values are never counted as 0:
 * they are left out of `amount` and counted in `missingCount`, so the screen can
 * tell "0 g" apart from "some foods have no data".
 *
 * @throws RangeError if an entry's `serving_quantity` is not a finite number above 0.
 */
export function calculateDailyTotals(entries: readonly LogEntry[]): DailyTotals {
  const sums: Record<Nutrient, number> = { calories: 0, protein: 0, carbohydrate: 0, fat: 0 };
  const missing: Record<Nutrient, number> = { calories: 0, protein: 0, carbohydrate: 0, fat: 0 };

  for (const entry of entries) {
    const quantity = entry.serving_quantity;
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      throw new RangeError(`serving_quantity must be a finite number above 0, got ${String(quantity)}`);
    }
    for (const nutrient of NUTRIENTS) {
      const perServing = entry[nutrient];
      if (isKnown(perServing)) {
        sums[nutrient] += perServing * quantity;
      } else {
        missing[nutrient] += 1;
      }
    }
  }

  const total = (nutrient: Nutrient): NutrientTotal => ({
    amount: roundToTenth(sums[nutrient]),
    missingCount: missing[nutrient],
  });

  return {
    entryCount: entries.length,
    calories: total('calories'),
    protein: total('protein'),
    carbohydrate: total('carbohydrate'),
    fat: total('fat'),
  };
}