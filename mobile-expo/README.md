# AgentDine Expo mobile app (SDK 54)

React Native / Expo customer app for AgentDine. It is separate from the existing Flutter application in `../mobile`. The app uses the same Express API, Firebase Authentication, PostgreSQL data, restaurant catalogue, reservations, and payment records as the web frontend.

## Run with Expo Go

1. Install Expo Go and sign in with your Expo account.
2. Copy `.env.example` to `.env`.
3. Replace the example IP address with your Windows PC's Wi-Fi IPv4 address from `ipconfig`.
4. Start the backend and AI service on the same network.
5. Install and verify the SDK-aligned dependencies:

```powershell
npm install
npx expo-doctor
npx expo start --tunnel
```

Scan the QR code with an Expo Go version compatible with SDK 54. `--tunnel` helps deliver the JavaScript bundle when local discovery does not work, but API requests still use `EXPO_PUBLIC_API_URL`. Use your PC's IPv4 address and allow ports 3000 and 8000 through the Windows firewall when testing from a physical phone.

If an earlier install mixed SDK 54 and SDK 55 packages, remove `node_modules` and `package-lock.json`, run `npm install`, and then run `npx expo-doctor` again. Do not use `--force` or `--legacy-peer-deps` to hide incompatible native packages.

## Security

Only use `EXPO_PUBLIC_*` values that are safe for a customer to see. Never add Firebase Admin JSON, Vertex credentials, database passwords, Stripe secret keys, or webhook secrets to this app.

## Implemented screens

- Firebase email/password sign-in and onboarding
- Restaurant discovery backed by the live API
- Restaurant details, menu, offers, availability, booking, and Stripe checkout handoff
- AI chat backed by the configured AI service
- Reservations with real booking/payment status
- Favorites, payment history, and customer profile
- Shared burgundy, cream, charcoal, and brass light/dark visual theme

Push notifications are not yet implemented as native device notifications; in-app booking and payment states come from the backend API.

## Verify

```powershell
npm run typecheck
npx expo-doctor
```
