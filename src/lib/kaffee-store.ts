"use client";

import { useState, useEffect } from "react";

export interface Kaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

export const DEFAULT_KAFFEE: Kaffee = {
  name: "Bologna Bio Fairtrade",
  herkunft: "Bio Arabica Blend",
  duftnotizen: "Klassisch italienisch, modern & frisch",
  fairtrade: true,
};

const STORAGE_KEY = "via1-current-kaffee";

// Globaler Store via localStorage + custom event
export function useCurrentKaffee(): [Kaffee, (k: Kaffee) => void] {
  const [kaffee, setKaffeeState] = useState<Kaffee>(DEFAULT_KAFFEE);

  useEffect(() => {
    // Initial aus localStorage laden
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setKaffeeState(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    // Auf Änderungen hören (andere Tabs/Komponenten)
    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent<Kaffee>).detail;
      if (detail) setKaffeeState(detail);
    }
    window.addEventListener("via1-kaffee-updated", handleUpdate);
    return () => window.removeEventListener("via1-kaffee-updated", handleUpdate);
  }, []);

  function setKaffee(k: Kaffee) {
    setKaffeeState(k);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(k));
      window.dispatchEvent(new CustomEvent("via1-kaffee-updated", { detail: k }));
    }
  }

  return [kaffee, setKaffee];
}
