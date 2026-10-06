import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const icons = {
  index: 'home-outline',
  explore: 'compass-outline',
  chat: 'chatbubble-ellipses-outline',
  reservations: 'calendar-outline',
  profile: 'person-outline',
} as const;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.onPrimary,
      tabBarInactiveTintColor: theme.textSecondary,
      tabBarHideOnKeyboard: true,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 1 },
      tabBarItemStyle: { borderRadius: 18, marginVertical: 6 },
      tabBarActiveBackgroundColor: theme.primary,
      tabBarStyle: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: Platform.OS === 'ios' ? 20 : 12,
        height: 68,
        paddingHorizontal: 6,
        paddingTop: 4,
        paddingBottom: 4,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 24,
        backgroundColor: theme.cardStrong,
        shadowColor: '#211A1B',
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      },
      tabBarIcon: ({ color, size, focused }) => (
        <Ionicons
          name={focused ? icons[route.name as keyof typeof icons].replace('-outline', '') as never : icons[route.name as keyof typeof icons]}
          color={color}
          size={focused ? size + 1 : size}
        />
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
