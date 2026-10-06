# AgentDine Expo mobile app

React Native / Expo customer app for AgentDine. It is separate from the existing Flutter application in `../mobile`.

## Run on an iPhone with Expo Go

1. Install **Expo Go** from the iOS App Store and sign in with your Expo account.
2. Copy `.env.example` to `.env`.
3. Replace `192.168.1.10` with your Windows PC's Wi-Fi IPv4 address from `ipconfig`.
4. Start the backend and AI service on the same Wi-Fi network.
5. Run:

```powershell
npm install
npx expo start --tunnel
```

Scan the QR code with Expo Go. `--tunnel` is useful if local Wi-Fi discovery does not work.

## Security

Only use `EXPO_PUBLIC_*` values that are safe for a customer to see. Never add Firebase Admin JSON, Vertex credentials, database passwords, Stripe secret keys, or webhook secrets to this app.

## Current starter screens

- Home and restaurant discovery
- AI-chat user interface
- Reservation and payment-status placeholder
- Customer profile and sign-in UI

Next implementation steps: Firebase Auth, authenticated backend API calls, real restaurant details/booking UI, Stripe PaymentSheet, and Firebase push notifications.
