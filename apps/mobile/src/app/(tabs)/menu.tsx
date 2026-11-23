import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { loadFoodPreferences } from '@/features/preferences/storage';
import type { DietaryRestrictionId } from '@/features/preferences/types';
import { useAddToLog } from '@/hooks/use-add-to-log';
import { useFoods } from '@/hooks/use-foods';
import { useTheme } from '@/hooks/use-theme';
import { defaultMealFor } from '@/lib/food/filter-foods';
import { buildMenuView, loadMenuRestrictions } from '@/lib/food/menu-view';
import { DINING_HALLS, type DiningHallId, type MealType } from '@/lib/food/types';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { foods, loading, error, refresh } = useFoods();
  const { openAddToLog, addToLogUI } = useAddToLog();
  const [diningHall, setDiningHall] = useState<DiningHallId | 'all'>('all');
  const [meal, setMeal] = useState<MealType>(() => defaultMealFor(new Date()));
  const [restrictions, setRestrictions] = useState<DietaryRestrictionId[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Reload saved restrictions whenever the tab gains focus, so changes made in
  // Settings apply on return. "Show all" only lasts for the current visit.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setShowAll(false);
      void loadMenuRestrictions(loadFoodPreferences).then((saved) => {
        if (active) setRestrictions(saved);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const {
    visible,
    counts,
    showBanner,
    restrictionLabels,
    hiddenCount,
    emptyBecauseOfDiet: hiddenByDiet,
  } = useMemo(
    () => buildMenuView({ foods, restrictions, showAll, diningHall, meal }),
    [foods, restrictions, showAll, diningHall, meal],
  );

  const hallName =
    diningHall === 'all' ? 'any dining hall' : DINING_HALLS.find((h) => h.id === diningHall)?.label;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          // On web the tab bar floats over the top of the page, so leave room for it.
          {
            paddingTop:
              Platform.OS === 'web' ? Spacing.six + Spacing.five : insets.top + Spacing.three,
          },
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
        {showBanner && (
          <View style={styles.bannerRow}>
            <View
              style={[styles.banner, { backgroundColor: theme.backgroundElement }]}
              accessibilityRole="summary">
              <ThemedText type="small" themeColor="textSecondary" style={styles.bannerText}>
                {showAll
                  ? `Showing all items · ${restrictionLabels.join(', ')} filter off`
                  : `Filtered for: ${restrictionLabels.join(', ')} · ${hiddenCount} hidden`}
              </ThemedText>
              <Pressable
                onPress={() => setShowAll((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: showAll }}
                accessibilityLabel="Show all items"
                hitSlop={8}>
                <ThemedText type="smallBold">{showAll ? 'Apply filters' : 'Show all'}</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
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
          renderItem={({ item }) => (
            <FoodCard
              item={item}
              showHall={diningHall === 'all'}
              onPress={(food) =>
                router.push({ pathname: '/food/[id]', params: { id: String(food.id) } })
              }
              onAddToLog={openAddToLog}
            />
          )}
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
                {hiddenByDiet
                  ? `Nothing matches your dietary filters for ${meal.toLowerCase()} at ${hallName} today. Try another meal or dining hall, or tap Show all.`
                  : `Nothing is listed for ${meal.toLowerCase()} at ${hallName} today. Try another meal or dining hall.`}
              </ThemedText>
            </View>
          }
        />
      )}

      {addToLogUI}
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
  bannerRow: {
    paddingHorizontal: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
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
