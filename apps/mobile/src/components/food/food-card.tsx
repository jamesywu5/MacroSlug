import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { DietaryRestrictionId } from '@/features/preferences/types';
import { getFoodSafetyInfo, NO_LABELS_WARNING, type FoodSafetyInfo } from '@/lib/food/safety-info';
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

const NO_RESTRICTIONS: readonly DietaryRestrictionId[] = [];

/**
 * One menu item: name, calories, protein / carbs / fat, the dining hall's
 * labels (marked unverified), and warnings for missing nutrition values,
 * missing labels, and dietary restrictions the item can't be confirmed for.
 */
export function FoodCard({
  item,
  showHall = false,
  restrictions = NO_RESTRICTIONS,
}: {
  item: FoodItem;
  showHall?: boolean;
  /** Dietary restrictions currently applied to the menu, for unverified-match notes. */
  restrictions?: readonly DietaryRestrictionId[];
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const safety = getFoodSafetyInfo(item, restrictions);
  const warnings = warningLines(item, safety);
  const otherLabels = [...safety.diets, ...safety.ingredients, ...safety.unrecognized];
  const warningColor = dark ? FoodColors.warningDark : FoodColors.warning;
  const warningBackground = dark ? FoodColors.warningBackgroundDark : FoodColors.warningBackground;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      accessible
      accessibilityLabel={describe(item, safety, warnings)}>
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

      {!safety.noLabels && (
        <View style={styles.labels}>
          <View style={styles.labelsHeader}>
            <ThemedText type="small" themeColor="textSecondary">
              Dining hall labels
            </ThemedText>
            <View style={[styles.unverified, { borderColor: warningColor }]}>
              <ThemedText type="small" style={[styles.chipText, { color: warningColor }]}>
                Unverified
              </ThemedText>
            </View>
          </View>

          {safety.allergens.length > 0 && (
            <View style={styles.chips}>
              <ThemedText type="smallBold" style={styles.containsLabel}>
                Contains
              </ThemedText>
              {safety.allergens.map((a) => (
                <View
                  key={a}
                  style={[styles.chip, { backgroundColor: warningBackground, borderColor: warningBackground }]}>
                  <ThemedText type="small" style={[styles.chipText, { color: warningColor }]}>
                    {a}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {otherLabels.length > 0 && (
            <View style={styles.chips}>
              {otherLabels.map((a) => (
                <View key={a} style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.chipText}>
                    {a}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {warnings.length > 0 && (
        <View style={[styles.warning, { backgroundColor: warningBackground }]}>
          {warnings.map((w) => (
            <ThemedText key={w} type="small" style={{ color: warningColor }}>
              {`⚠︎ ${w}`}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

function nutrientName(key: FoodItem['missing'][number]) {
  return { calories: 'calories', protein: 'protein', carbs: 'carbs', fat: 'fat' }[key];
}

function warningLines(item: FoodItem, safety: FoodSafetyInfo) {
  const lines: string[] = [];
  if (item.missing.length === 4) lines.push('No nutrition info for this item');
  else if (item.missing.length > 0) lines.push(`Missing: ${item.missing.map(nutrientName).join(', ')}`);
  if (safety.noLabels) lines.push(NO_LABELS_WARNING);
  lines.push(...safety.restrictionNotes);
  return lines;
}

function describe(item: FoodItem, safety: FoodSafetyInfo, warnings: string[]) {
  const parts = [
    item.name,
    item.calories === null ? 'calories unknown' : `${item.calories} calories`,
    ...MACROS.map(({ key, label }) =>
      item[key] === null ? `${label} unknown` : `${label} ${item[key]} grams`,
    ),
  ];
  if (!safety.noLabels) {
    const labels = [...safety.diets, ...safety.ingredients, ...safety.unrecognized];
    if (safety.allergens.length) parts.push(`contains ${safety.allergens.join(', ')}`);
    if (labels.length) parts.push(`labeled ${labels.join(', ')}`);
    parts.push('dining hall labels are unverified');
  }
  parts.push(...warnings.map((w) => `warning: ${w}`));
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
  labels: {
    gap: Spacing.two,
  },
  labelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  unverified: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  containsLabel: {
    fontSize: 12,
    lineHeight: 16,
    marginRight: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  warning: {
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    gap: 2,
  },
});
