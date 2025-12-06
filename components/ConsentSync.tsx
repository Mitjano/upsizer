"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Component that syncs cookie consent preferences with the database
 * when user logs in. Runs once per session.
 */
export default function ConsentSync() {
  const { data: session, status } = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once when user is authenticated
    if (status !== "authenticated" || !session?.user?.email || hasSynced.current) {
      return;
    }

    // Check localStorage for cookie consent
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      return;
    }

    try {
      const prefs = JSON.parse(consent);

      // If user has accepted marketing cookies, sync to database
      if (prefs.marketing === true) {
        hasSynced.current = true;

        fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newsletterFromCookieConsent: true,
          }),
        }).catch((err) => {
          console.debug("Consent sync failed:", err);
          // Reset flag to try again next time
          hasSynced.current = false;
        });
      }
    } catch {
      // Invalid JSON in localStorage
    }
  }, [status, session]);

  return null;
}
