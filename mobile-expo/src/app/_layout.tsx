import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { PushRegistration } from '@/components/push-registration';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigationTheme: Theme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <PushRegistration />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="restaurant/[id]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="waitlists" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="complaints" />
        <Stack.Screen name="loyalty" />
        <Stack.Screen name="promotions" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="chat-history" />
        <Stack.Screen name="review/[reservationId]" />
      </Stack>
    </ThemeProvider>
  );
}
