import { NutritionGoalsScreen } from '@/features/nutrition-goals/nutrition-goals-screen';
import { loadNutritionGoals, saveNutritionGoals } from '@/features/nutrition-goals/storage';

export default function NutritionGoalsRoute() {
  return <NutritionGoalsScreen loadGoals={loadNutritionGoals} saveGoals={saveNutritionGoals} />;
}
