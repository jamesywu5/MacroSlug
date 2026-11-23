import { useCallback, useEffect, useRef, useState } from 'react';

import { AddToLogSheet } from '@/components/food/add-to-log-sheet';
import { LogConfirmation } from '@/components/food/log-confirmation';
import { BottomTabInset } from '@/constants/theme';
import { confirmationMessage } from '@/features/daily-log/entries';
import { addFoodToLog } from '@/features/daily-log/storage';
import type { FoodItem } from '@/lib/food/types';

const CONFIRMATION_MS = 3000;

/**
 * The whole add-to-log flow for a screen: call `openAddToLog(food)` from a
 * button, and render `addToLogUI` once anywhere in the screen.
 */
export function useAddToLog({ bottomOffset = BottomTabInset }: { bottomOffset?: number } = {}) {
  const [food, setFood] = useState<FoodItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const openAddToLog = useCallback((item: FoodItem) => {
    setError(null);
    setFood(item);
  }, []);

  const close = useCallback(() => {
    if (!saving) setFood(null);
  }, [saving]);

  const confirm = useCallback(
    async (quantity: number) => {
      if (!food || saving) return;
      setSaving(true);
      setError(null);
      try {
        const entry = await addFoodToLog(food, quantity);
        setFood(null);
        setMessage(confirmationMessage(entry));
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setMessage(null), CONFIRMATION_MS);
      } catch {
        setError("Couldn't add this to your log. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [food, saving],
  );

  const addToLogUI = (
    <>
      <AddToLogSheet
        food={food}
        saving={saving}
        error={error}
        onCancel={close}
        onConfirm={confirm}
      />
      <LogConfirmation message={message} bottomOffset={bottomOffset} />
    </>
  );

  return { openAddToLog, addToLogUI };
}
