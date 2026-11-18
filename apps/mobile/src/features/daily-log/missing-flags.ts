import { NUTRIENTS, type DailyTotals, type Nutrient } from './totals';

export interface MissingFlag {
  nutrient: Nutrient;
  /** How many logged foods have no data for this nutrient. */
  missingCount: number;
  /** User-facing text, for example "2 foods have no protein data". */
  message: string;
}

export interface MissingValueReport {
  /** True when every logged food has data for every nutrient. */
  complete: boolean;
  /** One flag per nutrient with missing data, in the order calories, protein, carbohydrate, fat. */
  flags: MissingFlag[];
}

const NOUN: Record<Nutrient, string> = {
  calories: 'calorie',
  protein: 'protein',
  carbohydrate: 'carb',
  fat: 'fat',
};

/** Lists the nutrients whose totals are missing data from some logged foods. */
export function flagMissingValues(totals: DailyTotals): MissingValueReport {
  const flags: MissingFlag[] = [];

  for (const nutrient of NUTRIENTS) {
    const { missingCount } = totals[nutrient];
    if (missingCount > 0) {
      const foods = missingCount === 1 ? '1 food has' : `${missingCount} foods have`;
      flags.push({ nutrient, missingCount, message: `${foods} no ${NOUN[nutrient]} data` });
    }
  }

  return { complete: flags.length === 0, flags };
}

/**
 * Text for one nutrient's total. Unknown values are never shown as 0:
 * - no missing data: the amount, for example "1500" (a real zero is "0")
 * - some foods missing: the amount followed by "+", meaning "at least this much"
 * - every logged food missing: "—"
 */
export function formatTotal(totals: DailyTotals, nutrient: Nutrient): string {
  const { amount, missingCount } = totals[nutrient];
  if (missingCount === 0) return String(amount);
  if (missingCount >= totals.entryCount) return '—';
  return `${amount}+`;
}