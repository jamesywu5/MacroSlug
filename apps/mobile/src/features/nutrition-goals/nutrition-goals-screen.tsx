import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EMPTY_NUTRITION_GOALS, type NutritionGoalsInputState } from './types';
import {
  copyNutritionGoals,
  NUTRITION_GOAL_FIELDS,
  updateNutritionGoal,
} from './model';

interface NutritionGoalsScreenProps {
  onSave: (goals: NutritionGoalsInputState) => void;
}

export function NutritionGoalsScreen({ onSave }: NutritionGoalsScreenProps) {
  const theme = useTheme();
  const [goals, setGoals] = useState<NutritionGoalsInputState>(EMPTY_NUTRITION_GOALS);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const updateGoal = (field: keyof NutritionGoalsInputState, value: string) => {
    setGoals((current) => updateNutritionGoal(current, field, value));
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to settings"
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <SymbolView
                tintColor={theme.text}
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={20}
              />
            </Pressable>
            <ThemedText type="smallBold" style={styles.headerTitle}>
              Settings
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <KeyboardAvoidingView
            style={styles.body}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled">
              <ThemedText type="subtitle" style={styles.title}>
                Nutrition goals
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Set optional daily targets. Leave a field blank to skip it.
              </ThemedText>

              <View style={styles.fields}>
                {NUTRITION_GOAL_FIELDS.map(({ key, label, unit, keyboardType }) => (
                  <GoalInput
                    key={key}
                    label={label}
                    unit={unit}
                    value={goals[key]}
                    keyboardType={keyboardType}
                    onChangeText={(value) => updateGoal(key, value)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={[styles.actions, { borderTopColor: theme.backgroundSelected }]}>
              <Pressable
                accessibilityRole="button"
                onPress={handleBack}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onSave(copyNutritionGoals(goals))}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: theme.text },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  Save goals
                </ThemedText>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

interface GoalInputProps {
  label: string;
  unit: string;
  value: string;
  keyboardType: 'numeric' | 'decimal-pad';
  onChangeText: (value: string) => void;
}

function GoalInput({ label, unit, value, keyboardType, onChangeText }: GoalInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: focused ? theme.text : theme.backgroundSelected,
            borderWidth: focused ? 2 : 1,
          },
        ]}>
        <TextInput
          nativeID={`nutrition-goal-${label.toLowerCase().replace(/\s+/g, '-')}`}
          accessibilityLabel={`${label} daily target in ${unit}`}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Not set"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text, outlineColor: 'transparent', outlineWidth: 0 },
          ]}
        />
        <ThemedText themeColor="textSecondary">{unit}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  body: {
    flex: 1,
  },
  form: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: Spacing.one,
  },
  fields: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  saveButton: {
    flex: 2,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
