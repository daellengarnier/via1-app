"use client";

import { useState, useEffect } from "react";

export interface Kaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

export interface KaffeeState {
  kaffee: Kaffee;
  changedBy: string;
  changedAt: string; // YYYY-MM-DD
}

export const DEFAULT_KAFFEE: Kaffee = {
  name: "Bologna Bio Fairtrade",
  herkunft: "Bio Arabica Blend",
  duftnotizen: "Klassisch italienisch, modern & frisch",
  fairtrade: true,
};

const DEFAULT_STATE: KaffeeState = {
  kaffee: DEFAULT_KAFFEE,
  changedBy: "",
  changedAt: "",
};

const STORAGE_KEY = "via1-current-kaffee";
const EVENT_NAME = "via1-kaffee-updated";

// Globaler Store via localStorage + custom event
export function useCurrentKaffee(): [
  KaffeeState,
  (k: Kaffee, changedBy: string) => void,
] {
  const [state, setState] = useState<KaffeeState>(DEFAULT_STATE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        // Unterstuetze alt (nur Kaffee) und neu (KaffeeState)
        if (parsed && typeof parsed === "object") {
          if ("kaffee" in parsed) {
            setState(parsed as KaffeeState);
          } else {
            // Alt-Format: war nur der Kaffee
            setState({
              kaffee: parsed as Kaffee,
              changedBy: "",
              changedAt: "",
            });
          }
        }
      }
    } catch {
      // ignore
    }

    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent<KaffeeState>).detail;
      if (detail) setState(detail);
    }
    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, []);

  function setKaffee(k: Kaffee, changedBy: string) {
    const next: KaffeeState = {
      kaffee: k,
      changedBy,
      changedAt: new Date().toISOString().split("T")[0]!,
    };
    setState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
    }
  }

  return [state, setKaffee];
}
