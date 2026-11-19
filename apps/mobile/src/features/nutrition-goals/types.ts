export interface NutritionGoalsInputState {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export type NutritionGoalKey = keyof NutritionGoalsInputState;

/** Parsed daily goals. `null` means no goal is set for that nutrient. */
export type NutritionGoals = Record<NutritionGoalKey, number | null>;

/** Validation messages for the fields that are currently invalid. */
export type NutritionGoalErrors = Partial<Record<NutritionGoalKey, string>>;

export const EMPTY_NUTRITION_GOALS: NutritionGoalsInputState = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};
