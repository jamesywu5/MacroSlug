import AsyncStorage from '@react-native-async-storage/async-storage';

import { createNutritionGoalsStorage } from './storage-core';

const nutritionGoalsStorage = createNutritionGoalsStorage(AsyncStorage);

export const { loadNutritionGoals, saveNutritionGoals } = nutritionGoalsStorage;
