import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { DINING_HALLS, type FoodItem } from '@/lib/food/types';

import { FoodColors } from './tokens';

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

function hallLabel(item: FoodItem) {
  return DINING_HALLS.find((h) => h.id === item.diningHall)?.label ?? 'Unknown hall';
}

function formatGrams(value: number | null) {
  return value === null ? '—' : `${Math.round(value * 10) / 10}g`;
}

/**
 * One menu item: name, calories, protein / carbs / fat, allergens, and a
 * warning when any nutrition value is missing.
 */
export function FoodCard({ item, showHall = false }: { item: FoodItem; showHall?: boolean }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const hasMissing = item.missing.length > 0;
  const allMissing = item.missing.length === 4;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      accessible
      accessibilityLabel={describe(item)}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <ThemedText type="smallBold" style={styles.name} numberOfLines={2}>
            {item.name}
          </ThemedText>
          {showHall && (
            <ThemedText type="small" themeColor="textSecondary">
              {hallLabel(item)}
            </ThemedText>
          )}
        </View>
        <View style={styles.calories}>
          <ThemedText type="smallBold" style={styles.caloriesValue}>
            {item.calories ?? '—'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            cal
          </ThemedText>
        </View>
      </View>

      <View style={styles.macroRow}>
        {MACROS.map(({ key, label }) => {
          const value = item[key];
          return (
            <View key={key} style={[styles.macro, { backgroundColor: theme.background }]}>
              <ThemedText
                type="smallBold"
                themeColor={value === null ? 'textSecondary' : 'text'}>
                {formatGrams(value)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {label}
              </ThemedText>
            </View>
          );
        })}
      </View>

      {item.allergens.length > 0 && (
        <View style={styles.allergens}>
          {item.allergens.map((a) => (
            <View key={a} style={[styles.allergen, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.allergenText}>
                {a}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {hasMissing && (
        <View
          style={[
            styles.warning,
            { backgroundColor: dark ? FoodColors.warningBackgroundDark : FoodColors.warningBackground },
          ]}>
          <ThemedText
            type="small"
            style={{ color: dark ? FoodColors.warningDark : FoodColors.warning }}>
            {allMissing
              ? '⚠︎ No nutrition info for this item'
              : `⚠︎ Missing: ${item.missing.map(nutrientName).join(', ')}`}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

function nutrientName(key: FoodItem['missing'][number]) {
  return { calories: 'calories', protein: 'protein', carbs: 'carbs', fat: 'fat' }[key];
}

function describe(item: FoodItem) {
  const parts = [
    item.name,
    item.calories === null ? 'calories unknown' : `${item.calories} calories`,
    ...MACROS.map(({ key, label }) =>
      item[key] === null ? `${label} unknown` : `${label} ${item[key]} grams`,
    ),
  ];
  if (item.allergens.length) parts.push(`contains ${item.allergens.join(', ')}`);
  return parts.join(', ');
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
  },
  calories: {
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontSize: 18,
    lineHeight: 22,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macro: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  allergens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  allergen: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  allergenText: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  warning: {
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
});
