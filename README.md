# AgentDine local development

This repository runs locally without Docker. The web application consists of:

- PostgreSQL database
- FastAPI AI service on port `8000`
- Express backend on port `3000`
- Next.js frontend on port `3001`

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

## Running only the frontend

The visual shell can be started by itself:

```powershell
cd frontend
npm install
npm run dev -- -p 3001
```

Restaurant data, login, chat, reservations, and administration require the backend and related services.
