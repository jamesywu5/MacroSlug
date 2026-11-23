import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  EMPTY_NUTRITION_GOALS,
  type NutritionGoalErrors,
  type NutritionGoalKey,
  type NutritionGoals,
  type NutritionGoalsInputState,
  type StoredNutritionGoals,
} from './types';
import { NUTRITION_GOAL_FIELDS, updateNutritionGoal } from './model';
import { goalsToInputState } from './storage-core';
import { validateNutritionGoals } from './validation';

const LOAD_ERROR = 'Could not load your saved goals. Please try again.';
const SAVE_ERROR = 'Could not save your goals. Please try again.';
const SAVED_MESSAGE = 'Goals saved on this device.';

interface NutritionGoalsScreenProps {
  /** Loads previously saved goals. Rejects when storage cannot be read. */
  loadGoals: () => Promise<StoredNutritionGoals>;
  /** Saves parsed goals (blank fields are `null`). Called only when every field is valid. */
  saveGoals: (goals: NutritionGoals) => Promise<StoredNutritionGoals>;
}

export function NutritionGoalsScreen({ loadGoals, saveGoals }: NutritionGoalsScreenProps) {
  const theme = useTheme();
  const [goals, setGoals] = useState<NutritionGoalsInputState>(EMPTY_NUTRITION_GOALS);
  const [errors, setErrors] = useState<NutritionGoalErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  /** Fetches saved goals; state updates happen only after the request settles. */
  const fetchGoals = useCallback(
    (isCurrent: () => boolean = () => true) =>
      loadGoals().then(
        (stored) => {
          if (!isCurrent()) return;
          setGoals(goalsToInputState(stored.goals));
          setErrors({});
          setIsLoading(false);
        },
        () => {
          if (!isCurrent()) return;
          setLoadError(LOAD_ERROR);
          setIsLoading(false);
        }
      ),
    [loadGoals]
  );

  // `isLoading` starts true, so the first load needs no synchronous state update.
  useEffect(() => {
    let current = true;
    void fetchGoals(() => current);
    return () => {
      current = false;
    };
  }, [fetchGoals]);

  const retryLoad = () => {
    setIsLoading(true);
    setLoadError(null);
    void fetchGoals();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const updateGoal = (field: NutritionGoalKey, value: string) => {
    setGoals((current) => updateNutritionGoal(current, field, value));
    setSaveError(null);
    setSavedMessage(null);
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const { [field]: _cleared, ...rest } = current;
      return rest;
    });
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
    setSaveError(null);
    setSavedMessage(null);

    const result = validateNutritionGoals(goals);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const saved = await saveGoals(result.goals);
      setGoals(goalsToInputState(saved.goals));
      setSavedMessage(SAVED_MESSAGE);
    } catch {
      setSaveError(SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const showForm = !isLoading && loadError === null;

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

              {isLoading ? (
                <View style={styles.feedback}>
                  <ActivityIndicator color={theme.text} />
                  <ThemedText themeColor="textSecondary">Loading goals…</ThemedText>
                </View>
              ) : loadError !== null ? (
                <View style={styles.feedback}>
                  <ThemedText accessibilityRole="alert">{loadError}</ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={retryLoad}
                    style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      Try again
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.fields}>
                    {NUTRITION_GOAL_FIELDS.map(
                      ({ key, label, unit, keyboardType, placeholder }) => (
                        <GoalInput
                          key={key}
                          label={label}
                          unit={unit}
                          value={goals[key]}
                          keyboardType={keyboardType}
                          placeholder={placeholder}
                          error={errors[key]}
                          onChangeText={(value) => updateGoal(key, value)}
                        />
                      )
                    )}
                  </View>
                  {saveError !== null && (
                    <ThemedText
                      themeColor="error"
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite">
                      {saveError}
                    </ThemedText>
                  )}
                  {savedMessage !== null && (
                    <ThemedText
                      themeColor="textSecondary"
                      accessibilityRole="status"
                      accessibilityLiveRegion="polite">
                      {savedMessage}
                    </ThemedText>
                  )}
                </>
              )}
            </ScrollView>

            {showForm && (
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
                  accessibilityLabel="Save goals"
                  accessibilityState={{ disabled: isSaving, busy: isSaving }}
                  disabled={isSaving}
                  onPress={() => void handleSave()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                    isSaving && styles.disabled,
                  ]}>
                  {isSaving ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <ThemedText type="smallBold" style={{ color: theme.background }}>
                      Save goals
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            )}
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
  placeholder: string;
  error?: string;
  onChangeText: (value: string) => void;
}

function GoalInput({
  label,
  unit,
  value,
  keyboardType,
  placeholder,
  error,
  onChangeText,
}: GoalInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = error !== undefined;
  const borderColor = hasError ? theme.error : focused ? theme.text : theme.backgroundSelected;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderWidth: focused || hasError ? 2 : 1,
          },
        ]}>
        <TextInput
          nativeID={`nutrition-goal-${label.toLowerCase().replace(/\s+/g, '-')}`}
          accessibilityLabel={`${label} daily target in ${unit}`}
          accessibilityHint={error}
          aria-invalid={hasError}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text, outlineColor: 'transparent', outlineWidth: 0 },
          ]}
        />
        <ThemedText themeColor="textSecondary">{unit}</ThemedText>
      </View>
      {hasError && (
        <ThemedText
          type="small"
          themeColor="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
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
  feedback: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  retryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
