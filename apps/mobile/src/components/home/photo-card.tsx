import { ReactNode } from 'react'
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { colors, radius } from './theme'

type Props = {
  image?: ImageSourcePropType
  /** Shown behind the content when no image is provided yet. */
  fallbackColor?: string
  height: number
  onPress?: () => void
  accessibilityLabel?: string
  children: ReactNode
}

/** Rounded photo card with a dark gradient at the bottom so white text stays readable. */
export default function PhotoCard({ image, fallbackColor = '#3A3F5C', height, onPress, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, { height, backgroundColor: fallbackColor, opacity: pressed ? 0.92 : 1 }]}
    >
      {image && <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.35" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.65" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#fade)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    padding: 20,
  },
})
