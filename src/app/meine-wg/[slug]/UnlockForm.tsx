"use client";

import { useState } from "react";

interface UnlockFormProps {
  wgSlug: string;
  wgName: string;
}

export function UnlockForm({ wgSlug, wgName }: UnlockFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/meine-wg/${wgSlug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Entsperren fehlgeschlagen.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5"
    >
      <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
        🔒 Privater Bereich
      </p>
      <p className="mb-4 text-sm text-gray-300">
        Passwort fuer <span className="font-semibold text-white">{wgName}</span>{" "}
        eingeben:
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-600 focus:border-secondary focus:outline-none"
        placeholder="Passwort"
      />
      {error && (
        <p className="mb-3 text-xs text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full rounded-lg bg-secondary px-4 py-2 font-mono text-sm font-bold text-white hover:brightness-90 disabled:opacity-50"
      >
        {busy ? "..." : "Entsperren"}
      </button>
    </form>
  );
}
