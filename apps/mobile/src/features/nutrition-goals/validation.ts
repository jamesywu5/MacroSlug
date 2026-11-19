import type {
  NutritionGoalErrors,
  NutritionGoalKey,
  NutritionGoals,
  NutritionGoalsInputState,
} from './types';

export interface NutritionGoalValidation {
  /** Parsed goal, or `null` when the field is blank or invalid. */
  value: number | null;
  /** Message describing how to fix the input, or `null` when it is valid. */
  error: string | null;
}

export type NutritionGoalsValidationResult =
  | { ok: true; goals: NutritionGoals }
  | { ok: false; errors: NutritionGoalErrors };

const NUTRITION_GOAL_KEYS: readonly NutritionGoalKey[] = ['calories', 'protein', 'carbs', 'fat'];

const WHOLE_NUMBER = /^\d+$/;
// Digits with at most one decimal point and at least one digit: "85", "85.5", ".5", "85."
const DECIMAL_NUMBER = /^(?:\d+\.?\d*|\.\d+)$/;
const NEGATIVE_NUMBER = /^-\s*(?:\d+\.?\d*|\.\d+)$/;

export const NUTRITION_GOAL_ERRORS = {
  negative: 'Goal cannot be negative.',
  wholeNumber: 'Calories must be a whole number.',
  notANumber: 'Enter a number, such as 120 or 85.5.',
  notAWholeNumber: 'Enter a whole number, such as 2000.',
} as const;

function invalid(error: string): NutritionGoalValidation {
  return { value: null, error };
}

export function validateNutritionGoal(
  field: NutritionGoalKey,
  raw: string
): NutritionGoalValidation {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { value: null, error: null };
  }

  if (NEGATIVE_NUMBER.test(trimmed)) {
    return invalid(NUTRITION_GOAL_ERRORS.negative);
  }

  if (field === 'calories') {
    if (WHOLE_NUMBER.test(trimmed)) {
      return { value: Number(trimmed), error: null };
    }
    return invalid(
      DECIMAL_NUMBER.test(trimmed)
        ? NUTRITION_GOAL_ERRORS.wholeNumber
        : NUTRITION_GOAL_ERRORS.notAWholeNumber
    );
  }

  if (DECIMAL_NUMBER.test(trimmed)) {
    return { value: Number(trimmed), error: null };
  }

  return invalid(NUTRITION_GOAL_ERRORS.notANumber);
}

export function validateNutritionGoals(
  input: NutritionGoalsInputState
): NutritionGoalsValidationResult {
  const goals: NutritionGoals = { calories: null, protein: null, carbs: null, fat: null };
  const errors: NutritionGoalErrors = {};

  for (const key of NUTRITION_GOAL_KEYS) {
    const { value, error } = validateNutritionGoal(key, input[key]);
    if (error !== null) {
      errors[key] = error;
    } else {
      goals[key] = value;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, goals };
}
