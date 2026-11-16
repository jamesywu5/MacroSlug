import { useCallback, useEffect, useState } from 'react';

import { getFoodSource, type FoodSource } from '@/lib/food/food-source';
import { normalizeFoodRow } from '@/lib/food/filter-foods';
import type { FoodItem } from '@/lib/food/types';

type State = {
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads today's menu once and keeps it in memory. Filtering happens on the
 * device (see `filterFoods`), so switching halls or meals is instant.
 */
export function useFoods(source: FoodSource = getFoodSource()) {
  const [state, setState] = useState<State>({ foods: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const rows = await source.getFoods();
      setState({ foods: rows.map(normalizeFoodRow), loading: false, error: null });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Something went wrong loading the menu.',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
