import "dotenv/config";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";

const customerEmail = (process.env.CUSTOMER_EMAIL ?? "prabhathinduwara@gmail.com").toLowerCase();
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
const frontendEnv = dotenv.parse(readFileSync(new URL("../../frontend/.env.local", import.meta.url)));
const apiKey = frontendEnv.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is missing from frontend/.env.local");

const { adminAuth } = await import("../src/config/firebase.js");
const firebaseUser = await adminAuth.getUserByEmail(customerEmail);
const customToken = await adminAuth.createCustomToken(firebaseUser.uid);

const signInResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
);
const signIn = await signInResponse.json();
if (!signInResponse.ok) throw new Error(signIn.error?.message ?? "Firebase token exchange failed");

for (const path of ["auth/me", "reservations", "payments/history"]) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    headers: { Authorization: `Bearer ${signIn.idToken}` },
  });
  const body = await response.text();
  let summary = body;
  try {
    const parsed = JSON.parse(body);
    summary = Array.isArray(parsed)
      ? `${parsed.length} record(s): ${parsed.map((item) => `${item.id}:${item.status ?? item.role}`).join(", ")}`
      : JSON.stringify(parsed);
  } catch {
    // Keep non-JSON error text for diagnosis.
  }
  console.log(`${response.status} GET /api/${path} -> ${summary}`);
}
