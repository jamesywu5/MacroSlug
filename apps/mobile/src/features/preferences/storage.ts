import AsyncStorage from '@react-native-async-storage/async-storage';

import { createFoodPreferencesStorage } from './storage-core';

const foodPreferencesStorage = createFoodPreferencesStorage(AsyncStorage);

export const { loadFoodPreferences, saveFoodPreferences } = foodPreferencesStorage;
