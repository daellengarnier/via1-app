"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // refetchOnWindowFocus default true → bei jedem Tab-Wechsel feuert
  // NextAuth ein /api/auth/session, was Navigation auf langsamen Netzen
  // ausbremsen kann. Wir brauchen das nicht: die Session ist als JWT
  // im Cookie und gilt 30 Tage.
  // refetchInterval 0 = kein Polling.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
