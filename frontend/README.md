# AgentDine web frontend

Next.js customer, restaurant, and system-administration portals for AgentDine.

## Run locally

Configure `.env.local` from `.env.example`, start the backend on port 3000, then run:

```powershell
npm install
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

The frontend contains:

- Customer discovery, AI chat, booking/payment journey, notifications, loyalty, favorites, waitlist, complaints, and profile screens
- Restaurant reservations, confirmations, payments, menu, promotions, availability, partial/full closing dates, reviews, analytics, notifications, and profile screens
- System-administration dashboards and operational management screens
- Light/dark themes using the shared burgundy, cream, charcoal, and brass design system

## Verify

```powershell
npx tsc --noEmit
npm run lint
```

See the repository root `README.md` for database, Firebase, Vertex AI, Stripe, seed-account, and full-project startup instructions.
