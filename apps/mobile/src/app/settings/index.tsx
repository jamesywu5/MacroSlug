import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();

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

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens daily nutrition target inputs"
            onPress={() => router.push('/settings/nutrition-goals' as Href)}
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}>
            <View style={styles.settingCopy}>
              <ThemedText type="smallBold">Nutrition goals</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Set daily calorie and macro targets
              </ThemedText>
            </View>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{ ios: 'chevron.right', android: 'arrow_forward', web: 'arrow_forward' }}
              size={16}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
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
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.five,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  settingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#80808040',
  },
  settingCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.65,
  },
});
