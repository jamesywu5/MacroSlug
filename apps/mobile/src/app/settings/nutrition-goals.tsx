import { NutritionGoalsScreen } from '@/features/nutrition-goals/nutrition-goals-screen';

export default function NutritionGoalsRoute() {
  return (
    <NutritionGoalsScreen
      onSave={(goals) => console.log('Nutrition goals input:', goals)}
    />
  );
}
