import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

/**
 * Toast above the tab bar confirming a food was logged. It also reads the
 * message out for screen readers.
 */
export function LogConfirmation({
  message,
  bottomOffset = BottomTabInset,
}: {
  message: string | null;
  /** Space to leave below the toast, above the safe area. Defaults to the tab bar height. */
  bottomOffset?: number;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    AccessibilityInfo.announceForAccessibility(message);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [message, opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          opacity,
          bottom: insets.bottom + bottomOffset + Spacing.four,
        },
      ]}>
      <ThemedText type="smallBold" style={styles.check}>
        ✓
      </ThemedText>
      <ThemedText type="small" style={styles.text}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    maxWidth: MaxContentWidth - Spacing.four * 2,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    backgroundColor: '#1F7A4D',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  check: {
    color: '#FFFFFF',
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
  },
});
