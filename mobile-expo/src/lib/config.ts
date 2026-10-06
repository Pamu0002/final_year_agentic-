export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.10:3000',
  aiServiceUrl: process.env.EXPO_PUBLIC_AI_SERVICE_URL ?? 'http://192.168.1.10:8000',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;
