import type { FoodItem } from '../../lib/food/types';

import { createLogEntry, sanitizeLogEntry, toLocalDateString, type DailyLogEntry } from './entries';

/** Versioned so a future change to the entry shape can migrate old data. */
export const STORAGE_KEY_DAILY_LOG = 'macroslug.daily-log.v1';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type DailyLogStorageOptions = {
  /** Current time. Swappable so tests can pin the date. */
  now?: () => Date;
  /** New entry ids. Swappable so tests get predictable ids. */
  makeId?: () => string;
};

function defaultId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Saves the daily log on the device. The app has no sign-in yet, so it can't
 * call `POST /api/log-entries`; entries use the same fields as James' PR so they can be
 * sent there later.
 */
export function createDailyLogStorage(
  storage: KeyValueStorage,
  options: DailyLogStorageOptions = {},
) {
  const now = options.now ?? (() => new Date());
  const makeId = options.makeId ?? defaultId;
  // Saves run one at a time, so two quick taps can't both read the old list
  // and overwrite each other's entry.
  let queue: Promise<unknown> = Promise.resolve();

  async function loadAllEntries(): Promise<DailyLogEntry[]> {
    const stored = await storage.getItem(STORAGE_KEY_DAILY_LOG);
    if (stored === null) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      if (error instanceof SyntaxError) return [];
      throw error;
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeLogEntry).filter((e): e is DailyLogEntry => e !== null);
  }

  /** Entries for one day (YYYY-MM-DD), oldest first. Defaults to today. */
  async function loadEntriesForDate(
    date: string = toLocalDateString(now()),
  ): Promise<DailyLogEntry[]> {
    const all = await loadAllEntries();
    return all
      .filter((e) => e.consumption_date === date)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  /**
   * Logs a menu item for today and returns the saved entry.
   *
   * @throws RangeError for an invalid quantity; nothing is saved.
   */
  function addFoodToLog(food: FoodItem, quantity: number): Promise<DailyLogEntry> {
    const save = queue.then(async () => {
      const entry = createLogEntry(food, quantity, { now: now(), id: makeId() });
      const existing = await loadAllEntries();
      await storage.setItem(STORAGE_KEY_DAILY_LOG, JSON.stringify([...existing, entry]));
      return entry;
    });
    queue = save.catch(() => undefined);
    return save;
  }

  return { loadAllEntries, loadEntriesForDate, addFoodToLog };
}

export type DailyLogStorage = ReturnType<typeof createDailyLogStorage>;
