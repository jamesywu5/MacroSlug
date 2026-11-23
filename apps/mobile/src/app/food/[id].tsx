import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodColors } from '@/components/food/tokens';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAddToLog } from '@/hooks/use-add-to-log';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFoods } from '@/hooks/use-foods';
import { useTheme } from '@/hooks/use-theme';
import { DINING_HALLS, type FoodItem } from '@/lib/food/types';

const NUTRIENTS = [
  { key: 'calories', label: 'Calories', unit: '' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
] as const;

/** Height of the Add to Log footer, so the confirmation sits above it. */
const FOOTER_HEIGHT = 52 + Spacing.three + Spacing.two;

/** Food detail view, opened by tapping a card on the Menu tab. */
export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { foods, loading, error } = useFoods();
  const { openAddToLog, addToLogUI } = useAddToLog({ bottomOffset: FOOTER_HEIGHT });
  const food = foods.find((f) => String(f.id) === id);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/menu'));

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.topBar,
          { paddingTop: Platform.OS === 'android' ? insets.top + Spacing.two : Spacing.three },
        ]}>
        <Pressable onPress={close} accessibilityRole="button" hitSlop={10}>
          <ThemedText type="smallBold">Close</ThemedText>
        </Pressable>
      </View>

      {food ? (
        <FoodDetail food={food} onAdd={() => openAddToLog(food)} bottomInset={insets.bottom} />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.centered}>
          <ThemedText type="smallBold">
            {error ? "Couldn't load this food" : 'Food not found'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            {error ?? "It may not be on today's menu anymore."}
          </ThemedText>
        </View>
      )}

      {addToLogUI}
    </ThemedView>
  );
}

function FoodDetail({
  food,
  onAdd,
  bottomInset,
}: {
  food: FoodItem;
  onAdd: () => void;
  bottomInset: number;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const hall = DINING_HALLS.find((h) => h.id === food.diningHall)?.label ?? 'Unknown hall';

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <ThemedText type="subtitle" style={styles.title}>
            {food.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[hall, food.meal].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>

        <View>
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Nutrition per serving
          </ThemedText>
          <View style={styles.grid}>
            {NUTRIENTS.map(({ key, label, unit }) => {
              const value = food[key];
              return (
                <View
                  key={key}
                  style={[styles.tile, { backgroundColor: theme.backgroundElement }]}
                  accessible
                  accessibilityLabel={
                    value === null ? `${label} unknown` : `${label} ${value}${unit ? ' grams' : ''}`
                  }>
                  <ThemedText
                    type="subtitle"
                    style={styles.tileValue}
                    themeColor={value === null ? 'textSecondary' : 'text'}>
                    {value === null ? '—' : `${Math.round(value * 10) / 10}${unit}`}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {food.missing.length > 0 && (
          <View
            style={[
              styles.warning,
              {
                backgroundColor: dark
                  ? FoodColors.warningBackgroundDark
                  : FoodColors.warningBackground,
              },
            ]}>
            <ThemedText
              type="small"
              style={{ color: dark ? FoodColors.warningDark : FoodColors.warning }}>
              {food.missing.length === 4
                ? "⚠︎ The dining hall didn't list nutrition info for this item."
                : `⚠︎ The dining hall didn't list ${food.missing.join(', ')} for this item.`}
            </ThemedText>
          </View>
        )}

        {food.allergens.length > 0 && (
          <View>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Labels
            </ThemedText>
            <View style={styles.tags}>
              {food.allergens.map((a) => (
                <View key={a} style={[styles.tag, { borderColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.tagText}>
                    {a}
                  </ThemedText>
                </View>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
              From the dining hall&apos;s labels. Not verified.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + Spacing.three }]}>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Add ${food.name} to log`}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}>
          <ThemedText type="smallBold" style={{ color: FoodColors.onAccent }}>
            + Add to Log
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  titleBlock: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  sectionLabel: {
    marginBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 24,
    lineHeight: 30,
  },
  warning: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  disclaimer: {
    marginTop: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: FoodColors.accent,
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
});
