# AgentDine local development

This repository runs locally without Docker. The web application consists of:

- PostgreSQL database
- FastAPI AI service on port `8000`
- Express backend on port `3000`
- Next.js frontend on port `3001`
- Expo SDK 54 mobile application in `mobile-expo`

## Prerequisites

Install the following on Windows:

- Node.js 20 or newer
- Python 3.11
- PostgreSQL 16
- Git

Neo4j Aura can be used remotely, so a local Neo4j installation is not required. Redis is present in configuration but is not currently used by application code.

## 1. Create the PostgreSQL database

Using pgAdmin or `psql`, create the database:

```sql
CREATE DATABASE agent_platform;
```

The PostgreSQL username, password, host, and database name must match `backend/.env` and `ai-service/.env`.

## 2. Configure local environment files

From the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item ai-service/.env.example ai-service/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Replace every placeholder in those private files. Never commit `.env`, `.env.local`, Firebase Admin private keys, Stripe secret keys, Neo4j passwords, or Google service-account JSON files.

Place the Google Cloud service-account JSON at:

```text
credentials/gcp-key.json
```

Set `GOOGLE_APPLICATION_CREDENTIALS` in `ai-service/.env` to its absolute Windows path.

## 3. Install and migrate the backend

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

Optional seed commands:

```powershell
npm run seed:postgres
npm run seed:admin
npm run seed:restaurant-admin
```

`npm run seed:postgres` loads the local sample dataset without Firebase or Neo4j. The complete `npm run seed` command also requires valid Firestore and Neo4j configuration.

## 4. Install the AI service

```powershell
cd ..\ai-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks virtual-environment activation, run this once in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## 5. Install the frontend

```powershell
cd ..\frontend
npm install
```

## 6. Start the applications

Open three PowerShell windows.

AI service:

```powershell
cd C:\Users\ASUS\Desktop\finalyear_agentic_bot\ai-service
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend:

```powershell
cd C:\Users\ASUS\Desktop\finalyear_agentic_bot\backend
npm run dev
```

Frontend:

```powershell
cd C:\Users\ASUS\Desktop\finalyear_agentic_bot\frontend
npm run dev -- -p 3001
```

## 7. Open the web application

- Web application: http://localhost:3001
- Backend health: http://localhost:3000/health
- Backend Swagger UI: http://localhost:3000/api/docs
- AI service health: http://localhost:8000/health
- AI service documentation: http://localhost:8000/docs

The public landing page can render without all optional integrations. Login requires Firebase. AI chat requires Vertex AI credentials. Payments require Stripe test keys.

## 8. Run Stripe payments locally

Use the Stripe sandbox, not live mode. In a separate PowerShell window:

```powershell
stripe login
stripe switch
stripe listen --events "checkout.session.completed,checkout.session.expired,payment_intent.succeeded,payment_intent.payment_failed" --forward-to "http://localhost:3000/api/payments/webhook"
```

Choose your sandbox when `stripe switch` opens. Copy the `whsec_...` value printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the backend. Keep the listener running while testing.

Use Stripe test card `4242 4242 4242 4242`, any future expiry date, and any three-digit CVC. A successful deposit does not automatically confirm the table: the reservation remains pending until the restaurant accepts it. If the restaurant does not respond within `RESTAURANT_CONFIRMATION_MINUTES`, the backend cancels the booking and requests a refund.

## 9. Create local admin accounts

These commands create or update Firebase Authentication and PostgreSQL together, so valid Firebase Admin credentials are required in `backend/.env`:

```powershell
cd backend
npm run seed:admin
npm run seed:restaurant-admin
```

The restaurant-admin seed assigns the account to `Spice Route` by default. Override the test account or restaurant without changing source code by setting `TEST_RESTAURANT_ADMIN_EMAIL`, `TEST_RESTAURANT_ADMIN_PASSWORD`, `TEST_RESTAURANT_ADMIN_NAME`, and `TEST_RESTAURANT_NAME` in `backend/.env`.

## 10. Run the Expo mobile application

The Expo application uses the same backend and real database as the web frontend.

```powershell
cd mobile-expo
Copy-Item .env.example .env
npm install
npx expo-doctor
npx expo start --tunnel
```

The project targets Expo SDK 54. Install a compatible Expo Go client, or use an SDK 54 development build. For a physical phone on the same Wi-Fi network, set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AI_SERVICE_URL` to the PC's IPv4 address rather than `localhost`. The tunnel transports the Expo bundle; your phone still needs network access to the backend URL configured in `.env`.

## Useful checks

```powershell
cd backend
npm test
npm run db:status

cd ..\frontend
npx tsc --noEmit

cd ..\mobile-expo
npm run typecheck
npx expo-doctor
```

If backend startup reports `EADDRINUSE` for port 3000, an existing backend process is already running. Use that process or stop it before starting another one. If PostgreSQL is listed as `Running`, do not call `Start-Service` again.

## Running only the frontend

The visual shell can be started by itself:

```powershell
cd frontend
npm install
npm run dev -- -p 3001
```

Restaurant data, login, chat, reservations, and administration require the backend and related services.
