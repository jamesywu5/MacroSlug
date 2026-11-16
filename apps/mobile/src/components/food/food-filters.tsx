import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DINING_HALLS, MEAL_TYPES, type DiningHallId, type MealType } from '@/lib/food/types';

import { FoodColors } from './tokens';

type HallValue = DiningHallId | 'all';

/** Horizontally scrolling chips: All, then each dining hall. */
export function DiningHallFilter({
  value,
  onChange,
}: {
  value: HallValue;
  onChange: (value: HallValue) => void;
}) {
  const options: { id: HallValue; label: string }[] = [
    { id: 'all', label: 'All halls' },
    ...DINING_HALLS,
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      accessibilityRole="tablist">
      {options.map((option) => (
        <Chip
          key={option.id}
          label={option.label}
          selected={value === option.id}
          onPress={() => onChange(option.id)}
        />
      ))}
    </ScrollView>
  );
}

/** Segmented control for Breakfast / Lunch / Dinner. Shows a count, and dims meals with no items. */
export function MealFilter({
  value,
  onChange,
  counts,
}: {
  value: MealType;
  onChange: (value: MealType) => void;
  counts?: Partial<Record<MealType, number>>;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}
      accessibilityRole="tablist">
      {MEAL_TYPES.map((meal) => {
        const selected = value === meal;
        const count = counts?.[meal];
        const empty = count === 0;
        return (
          <Pressable
            key={meal}
            onPress={() => onChange(meal)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={count === undefined ? meal : `${meal}, ${count} items`}
            style={[styles.segment, selected && { backgroundColor: FoodColors.accent }]}>
            <ThemedText
              type="smallBold"
              style={[
                selected ? { color: FoodColors.onAccent } : { color: theme.text },
                empty && !selected && { color: theme.textSecondary },
              ]}>
              {meal}
              {count !== undefined ? ` · ${count}` : ''}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? FoodColors.accent : theme.backgroundElement },
        pressed && { opacity: 0.8 },
      ]}>
      <ThemedText
        type="small"
        style={{ color: selected ? FoodColors.onAccent : theme.text, fontWeight: selected ? 700 : 500 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: Spacing.one,
    marginHorizontal: Spacing.four,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
