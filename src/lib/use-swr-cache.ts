"use client";

import { useCallback, useEffect, useState } from "react";

// Stale-while-revalidate Hook mit localStorage-Persistenz.
// Beim Mount wird sofort die zuletzt gesehene Antwort gerendert (kein
// Skeleton-Flicker), waehrenddessen wird im Hintergrund neu geladen.
//
// Vorteile gegenueber direktem useEffect-fetch:
// - Tab-Wechsel oder App-Reopen fuehlen sich instant an
// - keine leeren Loading-Zustaende mehr nach dem ersten Besuch
// - bei Offline / langsamem Netz: Stale-Daten bleiben sichtbar
export function useSwrCache<T>(
  url: string | null,
  cacheKey: string
): {
  data: T | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });

  const refetch = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const fresh = (await res.json()) as T;
      setData(fresh);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(fresh));
      } catch {
        // Quota voll — kein Fail
      }
    } catch {
      // Netzwerk-Fehler — Stale-Daten bleiben sichtbar
    }
  }, [url, cacheKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, refetch };
}
