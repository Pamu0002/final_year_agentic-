"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { clearAuthCookie, refreshAuthToken, writeAuthCookie } from "@/lib/client/auth-token";

export function useSetAuthCookie() {
  useEffect(() => {
    const syncToken = async (forceRefresh = false) => {
      try {
        await refreshAuthToken(forceRefresh);
      } catch (error) {
        console.error("Unable to refresh Firebase authentication token", error);
      }
    };

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          await writeAuthCookie(user);
        } catch (error) {
          console.error("Unable to update authentication cookie", error);
        }
      } else {
        clearAuthCookie();
      }
    });

    // Firebase ID tokens expire after one hour. Refresh before expiry and also
    // whenever the user returns to a backgrounded tab.
    const timer = window.setInterval(() => void syncToken(true), 45 * 60 * 1000);
    const onFocus = () => void syncToken();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void syncToken();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
