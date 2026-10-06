import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

const icons = {
  index: 'home-outline',
  explore: 'compass-outline',
  chat: 'chatbubble-ellipses-outline',
  reservations: 'calendar-outline',
  profile: 'person-outline',
} as const;

export default function TabsLayout() {
  const dark = useColorScheme() === 'dark';
  const tint = dark ? '#D4B57D' : '#6B1E2E';
  const background = dark ? '#211A1B' : '#F7F1E7';

  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: tint,
      tabBarInactiveTintColor: dark ? '#B8AAA2' : '#746B66',
      tabBarStyle: { backgroundColor: background, borderTopColor: dark ? '#4A3035' : '#D9CCB9' },
      tabBarIcon: ({ color, size }) => (
        <Ionicons name={icons[route.name as keyof typeof icons]} color={color} size={size} />
      ),
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="chat" options={{ title: 'AI Chat' }} />
      <Tabs.Screen name="reservations" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
