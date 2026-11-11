export interface NutritionGoalsInputState {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export const EMPTY_NUTRITION_GOALS: NutritionGoalsInputState = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};
