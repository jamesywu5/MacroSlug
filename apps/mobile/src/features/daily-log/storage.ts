import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDailyLogStorage } from './storage-core';

const dailyLogStorage = createDailyLogStorage(AsyncStorage);

export const { loadAllEntries, loadEntriesForDate, addFoodToLog } = dailyLogStorage;
