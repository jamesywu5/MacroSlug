import type { NutritionGoalsInputState } from './types';

export const NUTRITION_GOAL_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', keyboardType: 'numeric', placeholder: '2000' },
  { key: 'protein', label: 'Protein', unit: 'g', keyboardType: 'decimal-pad', placeholder: '0.0' },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', keyboardType: 'decimal-pad', placeholder: '0.0' },
  { key: 'fat', label: 'Fat', unit: 'g', keyboardType: 'decimal-pad', placeholder: '0.0' },
] as const satisfies readonly {
  key: keyof NutritionGoalsInputState;
  label: string;
  unit: string;
  keyboardType: 'numeric' | 'decimal-pad';
  placeholder: string;
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
