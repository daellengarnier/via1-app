"use client";

import { useState, useEffect } from "react";

export interface PutzRunde {
  wg: string;
  completedAt: string | null;
}

export const INITIAL_ROTATION: PutzRunde[] = [
  { wg: "Nordwind", completedAt: "2026-02-15" },
  { wg: "Ostblock", completedAt: "2026-02-28" },
  { wg: "Dreiecksbar", completedAt: "2026-03-10" },
  { wg: "Kleenex", completedAt: null },
  { wg: "Family-WG", completedAt: null },
  { wg: "Bonzen", completedAt: null },
];

const STORAGE_KEY = "via1-putzplan-rotation";
const EVENT_NAME = "via1-putzplan-updated";

export function getCurrentWg(rotation: PutzRunde[]): string | null {
  const idx = rotation.findIndex((r) => r.completedAt === null);
  if (idx < 0) return null;
  return rotation[idx]!.wg;
}

// Shared-State-Hook fuer den Putzplan (noch nicht DB-persistent,
// aber via localStorage zwischen Home und Putzplan synchronisiert).
export function usePutzplan(): [
  PutzRunde[],
  (r: PutzRunde[]) => void,
  string | null,
] {
  const [rotation, setRotationState] =
    useState<PutzRunde[]>(INITIAL_ROTATION);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRotationState(JSON.parse(stored));
    } catch {
      // ignore
    }
    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent<PutzRunde[]>).detail;
      if (detail) setRotationState(detail);
    }
    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME, handleUpdate);
  }, []);

  function setRotation(next: PutzRunde[]) {
    setRotationState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
    }
  }

  return [rotation, setRotation, getCurrentWg(rotation)];
}
