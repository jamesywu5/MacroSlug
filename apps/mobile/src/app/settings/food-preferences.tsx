import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { loadFoodPreferences, saveFoodPreferences } from '@/features/preferences/storage';
import {
  DEFAULT_FOOD_PREFERENCES,
  DIETARY_RESTRICTION_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  type FoodPreferencesState,
  type PreferenceOption,
} from '@/features/preferences/types';
import { togglePreference } from '@/features/preferences/selection';

const LOAD_ERROR = 'Could not load saved preferences. Please try again.';
const SAVE_ERROR = 'Could not save your preferences. Please try again.';

export default function FoodPreferencesScreen() {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<FoodPreferencesState>(DEFAULT_FOOD_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setPreferences(await loadFoodPreferences());
    } catch {
      setLoadError(LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const clearMessages = () => {
    setSaveError(null);
    setSavedMessage(null);
  };

  const toggleRestriction = (id: FoodPreferencesState['dietaryRestrictions'][number]) => {
    clearMessages();
    setPreferences((current) => ({
      ...current,
      dietaryRestrictions: togglePreference(current.dietaryRestrictions, id),
    }));
  };

  const toggleFoodPreference = (id: FoodPreferencesState['foodPreferences'][number]) => {
    clearMessages();
    setPreferences((current) => ({
      ...current,
      foodPreferences: togglePreference(current.foodPreferences, id),
    }));
  };

  const clearAll = () => {
    clearMessages();
    setPreferences((current) => ({
      ...current,
      dietaryRestrictions: [],
      foodPreferences: [],
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      setPreferences(await saveFoodPreferences(preferences));
      setSavedMessage('Preferences saved on this device.');
    } catch {
      setSaveError(SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle" style={styles.pageTitle}>
              Food preferences
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Choose what to avoid and what you enjoy.
            </ThemedText>

            {isLoading ? (
              <View style={styles.feedback}>
                <ActivityIndicator color={theme.text} />
                <ThemedText themeColor="textSecondary">Loading preferences…</ThemedText>
              </View>
            ) : loadError ? (
              <View style={styles.feedback}>
                <ThemedText accessibilityRole="alert">{loadError}</ThemedText>
                <ActionLink label="Try again" onPress={() => void loadPreferences()} />
              </View>
            ) : (
              <>
                <PreferenceSection
                  title="Dietary restrictions"
                  description="Select any dietary patterns you follow."
                  options={DIETARY_RESTRICTION_OPTIONS}
                  selected={preferences.dietaryRestrictions}
                  onToggle={toggleRestriction}
                />
                <PreferenceSection
                  title="Food preferences"
                  description="Choose qualities you prefer in a meal."
                  options={FOOD_PREFERENCE_OPTIONS}
                  selected={preferences.foodPreferences}
                  onToggle={toggleFoodPreference}
                />

                <ThemedView type="backgroundElement" style={styles.notice}>
                  <ThemedText type="small" themeColor="textSecondary">
                    These choices are saved on this device. Food filtering and allergen
                    verification are not available yet.
                  </ThemedText>
                </ThemedView>

                {saveError && <ThemedText accessibilityRole="alert">{saveError}</ThemedText>}
                {savedMessage && (
                  <ThemedText accessibilityRole="status" themeColor="textSecondary">
                    {savedMessage}
                  </ThemedText>
                )}
              </>
            )}
          </ScrollView>

          {!isLoading && !loadError && (
            <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
              <ActionLink
                label="Clear all"
                onPress={clearAll}
                disabled={
                  isSaving ||
                  (preferences.dietaryRestrictions.length === 0 &&
                    preferences.foodPreferences.length === 0)
                }
              />
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void savePreferences()}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: theme.text },
                  pressed && styles.pressed,
                  isSaving && styles.disabled,
                ]}>
                {isSaving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText style={{ color: theme.background }} type="smallBold">
                    Save preferences
                  </ThemedText>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

interface PreferenceSectionProps<T extends string> {
  title: string;
  description: string;
  options: readonly PreferenceOption<T>[];
  selected: readonly T[];
  onToggle: (id: T) => void;
}

function PreferenceSection<T extends string>({
  title,
  description,
  options,
  selected,
  onToggle,
}: PreferenceSectionProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {description}
      </ThemedText>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              aria-checked={isSelected}
              onPress={() => onToggle(option.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.backgroundSelected : theme.background,
                  borderColor: isSelected ? theme.text : theme.backgroundSelected,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small">{option.label}</ThemedText>
              {isSelected && (
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ActionLink({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.actionLink, pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Pressable>
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
    paddingHorizontal: Spacing.four,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: 44,
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 44,
    right: 44,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: Spacing.one,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.five,
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.four,
  },
  feedback: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  footer: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
