import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DEFAULT_SERVINGS, scaleNutrition } from '@/features/daily-log/entries';
import { useTheme } from '@/hooks/use-theme';
import type { FoodItem } from '@/lib/food/types';

import { ServingQuantitySelector } from './serving-quantity-selector';
import { FoodColors } from './tokens';

type Props = {
  /** The food being logged. `null` keeps the sheet closed. */
  food: FoodItem | null;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (quantity: number) => void;
};

/** Bottom sheet that asks how many servings to log, with a live nutrition preview. */
export function AddToLogSheet({ food, saving, error, onCancel, onConfirm }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(DEFAULT_SERVINGS);

  // Start at 1 serving every time the sheet opens for a food.
  useEffect(() => {
    if (food) setQuantity(DEFAULT_SERVINGS);
  }, [food]);

  const preview = food ? scaleNutrition(food, quantity) : null;

  return (
    <Modal
      visible={food !== null}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
        {food && preview && (
          <ThemedView
            style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}
            accessibilityViewIsModal>
            <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />

            <View style={styles.titleBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                Add to today&apos;s log
              </ThemedText>
              <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
                {food.name}
              </ThemedText>
            </View>

            <ServingQuantitySelector value={quantity} onChange={setQuantity} />

            <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
              <PreviewValue label="Calories" value={preview.calories} />
              <PreviewValue label="Protein" value={preview.protein} unit="g" />
              <PreviewValue label="Carbs" value={preview.carbohydrate} unit="g" />
              <PreviewValue label="Fat" value={preview.fat} unit="g" />
            </View>
            {food.missing.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                Values marked — aren&apos;t on the dining hall label, so they won&apos;t count
                toward your totals.
              </ThemedText>
            )}

            {error && (
              <ThemedText type="small" style={styles.error} accessibilityLiveRegion="assertive">
                {error}
              </ThemedText>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => onConfirm(quantity)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`Add ${quantity} ${quantity === 1 ? 'serving' : 'servings'} to log`}
                accessibilityState={{ busy: saving, disabled: saving }}
                style={[styles.button, styles.primary]}>
                {saving ? (
                  <ActivityIndicator color={FoodColors.onAccent} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: FoodColors.onAccent }}>
                    Add to Log
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        )}
      </View>
    </Modal>
  );
}

function PreviewValue({
  label,
  value,
  unit = '',
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <View style={styles.previewItem}>
      <ThemedText type="smallBold" themeColor={value === null ? 'textSecondary' : 'text'}>
        {value === null ? '—' : `${value}${unit}`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  preview: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: Spacing.three,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
  },
  note: {
    marginTop: -Spacing.two,
  },
  error: {
    color: '#D93025',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 999,
  },
  primary: {
    backgroundColor: FoodColors.accent,
  },
});
