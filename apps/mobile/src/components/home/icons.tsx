import Svg, { Path, Circle } from 'react-native-svg'
import { colors } from './theme'

type IconProps = { size?: number; color?: string }

// ---- UI icons (24x24) ----

export function HomeIcon({ size = 24, color = colors.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5.2v-6H9.2v6H4a1 1 0 0 1-1-1z" fill={color} />
    </Svg>
  )
}

export function SwapIcon({ size = 24, color = colors.iconInactive }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 3.5 3.5 7 7 10.5" />
      <Path d="M3.5 7H20" />
      <Path d="M17 13.5l3.5 3.5-3.5 3.5" />
      <Path d="M20.5 17H4" />
    </Svg>
  )
}

export function CartIcon({ size = 24, color = colors.iconInactive }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2.5 3.5h2.3l2.6 10.7c.1.5.6.8 1.1.8h9.2c.5 0 .9-.3 1.1-.8L21 7H6" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.4 7H21l-2.2 7.5H8.2z" fill={color} />
      <Circle cx={9} cy={19.5} r={1.8} fill={color} />
      <Circle cx={17.5} cy={19.5} r={1.8} fill={color} />
    </Svg>
  )
}

export function HeartIcon({ size = 24, color = colors.iconInactive }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.2l-1.4-1.3C5.5 15.3 2 12.1 2 8.2 2 5 4.5 2.5 7.6 2.5c1.8 0 3.5.8 4.4 2.1.9-1.3 2.6-2.1 4.4-2.1C19.5 2.5 22 5 22 8.2c0 3.9-3.5 7.1-8.6 11.7z"
        fill={color}
      />
    </Svg>
  )
}

export function BellIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22.5a2.6 2.6 0 0 0 2.5-2h-5a2.6 2.6 0 0 0 2.5 2z" fill={color} />
      <Path d="M19 16v-5a7 7 0 0 0-5.5-6.8v-.9a1.5 1.5 0 0 0-3 0v.9A7 7 0 0 0 5 11v5l-2 2v1.2h18V18z" fill={color} />
    </Svg>
  )
}

export function ArrowRightIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 12h17" />
      <Path d="M14 5.5 20.5 12 14 18.5" />
    </Svg>
  )
}

// ---- Food category line icons (48x48) ----

type FoodIconProps = { size?: number; color?: string }

function FoodSvg({ size = 48, color = colors.accentStroke, children }: FoodIconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  )
}

export function FruitIcon(props: FoodIconProps) {
  return (
    <FoodSvg {...props}>
      {/* pear */}
      <Path d="M18 15c-1.6 0-2.4 1.6-2.4 3.6 0 3-6.6 6.2-6.6 12.6A9 9 0 0 0 18 40a9 9 0 0 0 9-8.8c0-6.4-6.6-9.6-6.6-12.6 0-2-.8-3.6-2.4-3.6z" />
      <Path d="M18 15c0-2.5.8-4.5 2.5-6" />
      <Path d="M13 31c0 3 2 5 4.5 5.5" />
      {/* banana */}
      <Path d="M29 12c2 6 9 9 9 17 0 7-5 11-11 11 5-3 7-7 6-12-1-6-6-9-6-14 0-1.2.8-2.2 2-2z" />
      <Path d="M29 12l-1-3" />
    </FoodSvg>
  )
}

export function VeggieIcon(props: FoodIconProps) {
  return (
    <FoodSvg {...props}>
      {/* big mushroom */}
      <Path d="M8 22c0-7 6-12 13-12s13 5 13 12z" />
      <Path d="M16 22v14a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V22" />
      <Circle cx={15} cy={16} r={1.6} />
      <Circle cx={22} cy={13.5} r={1.4} />
      <Circle cx={27} cy={18} r={1.6} />
      {/* small mushroom */}
      <Path d="M30 30c0-3.5 3-6 6-6s6 2.5 6 6z" />
      <Path d="M34 30v7a2 2 0 0 0 4 0v-7" />
      <Path d="M6 40h37" />
    </FoodSvg>
  )
}

export function DairyIcon(props: FoodIconProps) {
  return (
    <FoodSvg {...props}>
      {/* milk carton */}
      <Path d="M12 18h14v22H12z" />
      <Path d="M12 18l3-6h8l3 6" />
      <Path d="M15 12V8h8v4" />
      <Path d="M16 26l3 3 4-4" />
      {/* cheese */}
      <Path d="M26 30l12-5 4 5z" />
      <Path d="M26 30v10h16V30" />
      <Circle cx={31} cy={35} r={1.5} />
      <Circle cx={37.5} cy={34} r={1.1} />
      {/* eggs */}
      <Path d="M5 40c0-3 1.4-6 3.5-6S12 37 12 40z" />
    </FoodSvg>
  )
}

export function GrainIcon(props: FoodIconProps) {
  return (
    <FoodSvg {...props}>
      <Path d="M6 24h36a18 15 0 0 1-36 0z" />
      <Path d="M12 24c0-5 5-8 12-8s12 3 12 8" />
      <Circle cx={18} cy={20} r={1.2} />
      <Circle cx={24} cy={18.5} r={1.2} />
      <Circle cx={30} cy={20} r={1.2} />
      <Path d="M18 41h12" />
      <Path d="M24 11c-1.5-2 1.5-3 0-5" />
    </FoodSvg>
  )
}
