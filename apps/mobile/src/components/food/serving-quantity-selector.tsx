import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  formatServings,
  MAX_SERVINGS,
  MIN_SERVINGS,
  stepServingQuantity,
} from '@/features/daily-log/entries';
import { useTheme } from '@/hooks/use-theme';

import { FoodColors } from './tokens';

const PRESETS = [0.5, 1, 1.5, 2];

/**
 * Picks how many servings to log: − / + buttons in half-serving steps
 * (0.5 to 10) plus quick picks for the common amounts.
 */
export function ServingQuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  const atMin = value <= MIN_SERVINGS;
  const atMax = value >= MAX_SERVINGS;

  return (
    <View style={styles.container}>
      <View
        style={styles.stepper}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Servings"
        accessibilityValue={{ text: formatServings(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onChange(stepServingQuantity(value, e.nativeEvent.actionName === 'increment' ? 1 : -1))
        }>
        <StepButton
          label="−"
          disabled={atMin}
          onPress={() => onChange(stepServingQuantity(value, -1))}
        />
        <View style={styles.valueBlock}>
          <ThemedText type="subtitle" style={styles.value}>
            {value}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {value === 1 ? 'serving' : 'servings'}
          </ThemedText>
        </View>
        <StepButton
          label="+"
          disabled={atMax}
          onPress={() => onChange(stepServingQuantity(value, 1))}
        />
      </View>

      <View style={styles.presets}>
        {PRESETS.map((preset) => {
          const selected = preset === value;
          return (
            <Pressable
              key={preset}
              onPress={() => onChange(preset)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={formatServings(preset)}
              style={[
                styles.preset,
                { backgroundColor: selected ? FoodColors.accent : theme.backgroundElement },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? FoodColors.onAccent : theme.text }}>
                {preset}×
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // The stepper as a whole is the accessible control, so hide the parts.
      importantForAccessibility="no"
      accessibilityElementsHidden
      hitSlop={6}
      style={({ pressed }) => [
        styles.stepButton,
        { backgroundColor: theme.backgroundElement },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <ThemedText type="subtitle" style={styles.stepLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 28,
    lineHeight: 32,
  },
  valueBlock: {
    alignItems: 'center',
  },
  value: {
    fontSize: 34,
    lineHeight: 40,
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
