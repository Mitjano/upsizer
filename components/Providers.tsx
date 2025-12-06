"use client";

import { SessionProvider } from "next-auth/react";
import CookieConsent from "./CookieConsent";
import ConsentSync from "./ConsentSync";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CookieConsent />
      <ConsentSync />
    </SessionProvider>
  );
}
