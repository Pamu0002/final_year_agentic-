"use client";

import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AUTH_COOKIE, COOKIE_MAX_AGE } from "@/lib/cookie";

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function writeAuthCookie(user: User, forceRefresh = false): Promise<string> {
  const token = await user.getIdToken(forceRefresh);
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return token;
}

export async function refreshAuthToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    clearAuthCookie();
    return null;
  }
  return writeAuthCookie(user, forceRefresh);
}
