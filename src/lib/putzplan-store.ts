"use client";

import { useState, useEffect, useCallback } from "react";

export interface PutzRunde {
  wg: string;
  completedAt: string | null;
}

export function getCurrentWg(rotation: PutzRunde[]): string | null {
  const idx = rotation.findIndex((r) => r.completedAt === null);
  if (idx >= 0) return rotation[idx]!.wg;
  return rotation[0]?.wg ?? null;
}

export function isRoundComplete(rotation: PutzRunde[]): boolean {
  return rotation.length > 0 && rotation.every((r) => r.completedAt !== null);
}

export function usePutzplan(): [
  PutzRunde[],
  (wg: string, completedAt?: string) => Promise<void>,
  string | null,
  boolean,
] {
  const [rotation, setRotation] = useState<PutzRunde[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/putzplan");
      if (!res.ok) return;
      const data = (await res.json()) as PutzRunde[];
      setRotation(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markComplete(wg: string, completedAt?: string) {
    try {
      const res = await fetch("/api/putzplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          wg,
          ...(completedAt ? { completedAt } : {}),
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as PutzRunde[];
      setRotation(data);
    } catch {
      // ignore
    }
  }

  return [rotation, markComplete, getCurrentWg(rotation), loading];
}
