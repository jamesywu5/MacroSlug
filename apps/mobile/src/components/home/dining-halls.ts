import { ImageSourcePropType } from 'react-native'

export type DiningHall = {
  id: string
  name: string
  /** Export the photo from Figma into assets/images/home/ and set it here, e.g. require('@/assets/images/home/rcc-oakes.jpg') */
  image?: ImageSourcePropType
  fallbackColor: string
}

// TODO: replace with a Supabase query once the S1-2 data layer endpoints are done.
export const DINING_HALLS: DiningHall[] = [
  { id: 'rcc-oakes', name: 'RCC / Oakes', fallbackColor: '#3E4470' },
  { id: 'cowell-stevenson', name: 'Cowell / Stevenson', fallbackColor: '#4F5A3A' },
  { id: 'crown-merrill', name: 'Crown / Merrill', fallbackColor: '#5A4A3A' },
  { id: 'porter-kresge', name: 'Porter / Kresge', fallbackColor: '#3A5458' },
  { id: 'nine-jrl', name: 'College Nine / John R. Lewis', fallbackColor: '#53405E' },
]
