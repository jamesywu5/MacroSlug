import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const warningColors = {
  background: '#FFF4D6',
  border: '#D98C00',
  text: '#4A3200',
  badge: '#8A4B00',
} as const;

export function AllergenSafetyNotice() {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: warningColors.background, borderColor: warningColors.border },
      ]}>
      <View style={[styles.badge, { borderColor: warningColors.badge }]}>
        <Text
          style={[styles.badgeText, { color: warningColors.badge }]}
          accessibilityLabel="Allergen and ingredient information is unverified">
          UNVERIFIED
        </Text>
      </View>
      <ThemedText type="smallBold" style={{ color: warningColors.text }}>
        Allergen &amp; ingredient information
      </ThemedText>
      <ThemedText type="small" style={{ color: warningColors.text }}>
        Menu information may be incomplete and has not been verified by dining staff. Ingredients
        and cross-contact risks may be missing. If you have an allergy, confirm directly with
        dining staff before eating. Do not rely on this app to determine whether food is safe.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    flexShrink: 1,
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
