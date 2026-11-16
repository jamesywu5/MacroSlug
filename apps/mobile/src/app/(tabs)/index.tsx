import { router } from 'expo-router';

import HomeScreen from '@/components/home/home-screen';

export default function Home() {
  return <HomeScreen name="Slug" onOpenSettings={() => router.push('/settings')} />;
}
