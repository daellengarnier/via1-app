"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

// Sticky-Banner oben am Bildschirm wenn ein Admin gerade einen anderen
// User impersoniert. Klar markiert + 1-Klick-Stop.
export function ImpersonationBanner() {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);

  const impersonatedBy = session?.user?.impersonatedBy;
  if (!impersonatedBy) return null;

  async function stop() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/impersonate/stop", {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Konnte Impersonation nicht stoppen.");
        return;
      }
      window.location.href = "/admin/users";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-[100] w-full bg-purple-600 text-white shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-1.5">
        <p className="truncate font-mono text-[10px] uppercase tracking-wider">
          🎭 Eingeloggt als <strong>{session?.user?.name}</strong> · Admin{" "}
          <strong>{impersonatedBy.name}</strong>
        </p>
        <button
          onClick={stop}
          disabled={busy}
          className="shrink-0 rounded bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-white/30 disabled:opacity-50"
        >
          {busy ? "…" : "Stop"}
        </button>
      </div>
    </div>
  );
}
