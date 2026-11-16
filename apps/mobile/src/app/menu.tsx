import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodCard } from '@/components/food/food-card';
import { DiningHallFilter, MealFilter } from '@/components/food/food-filters';
import { FoodColors } from '@/components/food/tokens';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useFoods } from '@/hooks/use-foods';
import { countByMeal, defaultMealFor, filterFoods } from '@/lib/food/filter-foods';
import { DINING_HALLS, type DiningHallId, type MealType } from '@/lib/food/types';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { foods, loading, error, refresh } = useFoods();
  const [diningHall, setDiningHall] = useState<DiningHallId | 'all'>('all');
  const [meal, setMeal] = useState<MealType>(() => defaultMealFor(new Date()));

  const inHall = useMemo(() => filterFoods(foods, { diningHall, meal: 'all' }), [foods, diningHall]);
  const visible = useMemo(() => filterFoods(inHall, { diningHall: 'all', meal }), [inHall, meal]);
  const counts = useMemo(() => countByMeal(inHall), [inHall]);

  const hallName =
    diningHall === 'all' ? 'any dining hall' : DINING_HALLS.find((h) => h.id === diningHall)?.label;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          // On web the tab bar floats over the top of the page, so leave room for it.
          { paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.five : insets.top + Spacing.three },
        ]}>
        <ThemedText type="subtitle" style={styles.title}>
          Menu
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Browse what&apos;s being served today
        </ThemedText>
      </View>

      <View style={styles.filters}>
        <DiningHallFilter value={diningHall} onChange={setDiningHall} />
        <MealFilter value={meal} onChange={setMeal} counts={loading ? undefined : counts} />
      </View>

      {loading && foods.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error && foods.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText type="smallBold">Couldn&apos;t load the menu</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            {error}
          </ThemedText>
          <Pressable onPress={refresh} style={styles.retry} accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: FoodColors.onAccent }}>
              Try again
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <FoodCard item={item} showHall={diningHall === 'all'} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="smallBold">No {meal.toLowerCase()} items</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Nothing is listed for {meal.toLowerCase()} at {hallName} today. Try another meal or
                dining hall.
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: Spacing.one,
  },
  filters: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  retry: {
    marginTop: Spacing.two,
    backgroundColor: FoodColors.accent,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
});
