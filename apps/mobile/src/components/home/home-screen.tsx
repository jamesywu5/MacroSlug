import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { BottomTabInset } from '@/constants/theme'

import { DINING_HALLS } from './dining-halls'
import { ArrowRightIcon, BellIcon, DairyIcon, FruitIcon, GrainIcon, HeartIcon, VeggieIcon } from './icons'
import PhotoCard from './photo-card'
import { colors, radius, shadow, spacing } from './theme'

type Props = {
  name: string
  hasNotifications?: boolean
  onOpenNotifications?: () => void
  onOpenDailyIntake?: () => void
  onOpenMacros?: () => void
  onOpenDiningHalls?: () => void
  onOpenDiningHall?: (id: string) => void
}

const FOOD_CATEGORIES = [
  { key: 'fruit', label: 'Fruit', Icon: FruitIcon },
  { key: 'veggies', label: 'Vegetables', Icon: VeggieIcon },
  { key: 'dairy', label: 'Dairy', Icon: DairyIcon },
  { key: 'grains', label: 'Grains', Icon: GrainIcon },
]

const COLLAPSED_HALL_COUNT = 2

function greetingFor(date: Date) {
  const h = date.getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function formatShortDate(date: Date) {
  // e.g. "Wed Oct 22"
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '')
}

export default function HomeScreen({
  name,
  hasNotifications = true,
  onOpenNotifications,
  onOpenDailyIntake,
  onOpenMacros,
  onOpenDiningHalls,
  onOpenDiningHall,
}: Props) {
  const insets = useSafeAreaInsets()
  const today = useMemo(() => new Date(), [])
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['rcc-oakes', 'cowell-stevenson']))
  const [showAllHalls, setShowAllHalls] = useState(false)

  const halls = showAllHalls ? DINING_HALLS : DINING_HALLS.slice(0, COLLAPSED_HALL_COUNT)

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        // Clear the status bar on top and the native tab bar on the bottom.
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + BottomTabInset + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* The screen is always light, so keep the status bar text dark even in dark mode. */}
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greetingFor(today)}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Pressable onPress={onOpenNotifications} accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={10}>
          <BellIcon size={24} />
          {hasNotifications && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      {/* Daily intake hero */}
      <View style={styles.block}>
        <PhotoCard height={170} fallbackColor="#2F4A2A" onPress={onOpenDailyIntake} accessibilityLabel="Open daily intake">
          <View style={styles.bottomLeft}>
            <Text style={styles.heroDate}>{formatShortDate(today)}</Text>
            <Text style={styles.heroTitle}>Daily Intake</Text>
          </View>
        </PhotoCard>
      </View>

      {/* Macros */}
      <SectionHeader title="Macros" onPress={onOpenMacros} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tileRow}
        contentContainerStyle={styles.tileRowContent}
      >
        {FOOD_CATEGORIES.map(({ key, label, Icon }) => (
          <Pressable
            key={key}
            onPress={onOpenMacros}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Icon size={46} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Dining halls */}
      <SectionHeader title="Dining Halls" onPress={onOpenDiningHalls} />
      {halls.map((hall) => {
        const fav = favorites.has(hall.id)
        return (
          <View key={hall.id} style={styles.hallCard}>
            <PhotoCard
              height={216}
              image={hall.image}
              fallbackColor={hall.fallbackColor}
              onPress={() => onOpenDiningHall?.(hall.id)}
              accessibilityLabel={`${hall.name} dining hall`}
            >
              <Pressable
                onPress={() => toggleFavorite(hall.id)}
                accessibilityRole="button"
                accessibilityLabel={fav ? `Remove ${hall.name} from favorites` : `Add ${hall.name} to favorites`}
                hitSlop={10}
                style={styles.heart}
              >
                <HeartIcon size={34} color={fav ? colors.heart : 'rgba(255,255,255,0.85)'} />
              </Pressable>
              <View style={styles.bottomLeft}>
                <Text style={styles.hallName}>{hall.name}</Text>
                <Text style={styles.hallSub}>Dining Hall</Text>
              </View>
            </PhotoCard>
          </View>
        )
      })}

      {DINING_HALLS.length > COLLAPSED_HALL_COUNT && (
        <Pressable
          onPress={() => setShowAllHalls((v) => !v)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.moreButton, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.moreText}>{showAllHalls ? 'Less' : 'More'}</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`See all ${title}`} hitSlop={10}>
        <ArrowRightIcon size={24} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 6,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  block: {
    marginBottom: spacing.section,
  },
  bottomLeft: {
    marginTop: 'auto',
  },
  heroDate: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  tileRow: {
    // let the row bleed past the right gutter like the mockup
    marginRight: -spacing.screen,
    marginBottom: spacing.section,
    overflow: 'visible',
  },
  tileRowContent: {
    gap: 18,
    paddingRight: spacing.screen,
    paddingVertical: 8,
  },
  tile: {
    width: 96,
    height: 76,
    borderRadius: radius.tile,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  hallCard: {
    marginBottom: 22,
  },
  heart: {
    alignSelf: 'flex-start',
    marginTop: -2,
    marginLeft: 12,
  },
  hallName: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '400',
    marginBottom: 4,
  },
  hallSub: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  moreButton: {
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  moreText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
