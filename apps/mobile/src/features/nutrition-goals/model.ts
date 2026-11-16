import type { NutritionGoalsInputState } from './types';

export const NUTRITION_GOAL_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', keyboardType: 'numeric' },
  { key: 'protein', label: 'Protein', unit: 'g', keyboardType: 'decimal-pad' },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', keyboardType: 'decimal-pad' },
  { key: 'fat', label: 'Fat', unit: 'g', keyboardType: 'decimal-pad' },
] as const satisfies readonly {
  key: keyof NutritionGoalsInputState;
  label: string;
  unit: string;
  keyboardType: 'numeric' | 'decimal-pad';
}[];

export function updateNutritionGoal(
  goals: NutritionGoalsInputState,
  field: keyof NutritionGoalsInputState,
  value: string
): NutritionGoalsInputState {
  return { ...goals, [field]: value };
}

export function copyNutritionGoals(goals: NutritionGoalsInputState): NutritionGoalsInputState {
  return { ...goals };
}
