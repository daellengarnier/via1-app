"use client";

import { useState, useEffect, useCallback } from "react";

export interface Kaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

export interface KaffeeState {
  kaffee: Kaffee;
  changedBy: string;
  changedAt: string;
}

export const DEFAULT_KAFFEE: Kaffee = {
  name: "Unbekannt",
  herkunft: "",
  duftnotizen: "",
  fairtrade: false,
};

const DEFAULT_STATE: KaffeeState = {
  kaffee: DEFAULT_KAFFEE,
  changedBy: "",
  changedAt: "",
};

export function useCurrentKaffee(): [
  KaffeeState,
  (k: Kaffee, changedBy: string) => void,
] {
  const [state, setState] = useState<KaffeeState>(DEFAULT_STATE);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kaffee");
      if (!res.ok) return;
      const data = (await res.json()) as {
        name: string;
        herkunft: string;
        duftnotizen: string;
        fairtrade: boolean;
        changedBy: string;
        changedAt: string | null;
      };
      setState({
        kaffee: {
          name: data.name,
          herkunft: data.herkunft,
          duftnotizen: data.duftnotizen,
          fairtrade: data.fairtrade,
        },
        changedBy: data.changedBy,
        changedAt: data.changedAt ?? "",
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setKaffee(k: Kaffee, changedBy: string) {
    setState({
      kaffee: k,
      changedBy,
      changedAt: new Date().toISOString().split("T")[0]!,
    });
    fetch("/api/kaffee", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: k.name,
        herkunft: k.herkunft,
        duftnotizen: k.duftnotizen,
        fairtrade: k.fairtrade,
      }),
    }).catch(() => {});
  }

  return [state, setKaffee];
}
