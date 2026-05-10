"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AdminWg {
  id: string;
  name: string;
  slug: string;
  floor: number;
  side: "NORD" | "OST";
  hasPassword: boolean;
  passwordSetAt: string | null;
  passwordSetBy: string | null;
}

export default function AdminWgsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [wgs, setWgs] = useState<AdminWg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/wgs");
      if (res.status === 403) {
        setError("Nur Admins.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setWgs((await res.json()) as AdminWg[]);
      setError(null);
    } catch (err) {
      console.error("WGs laden", err);
      setError("Konnte WGs nicht laden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    load();
  }, [status, session, router, load]);

  function startEdit(id: string) {
    setEditingId(id);
    setNewPassword("");
  }

  function cancelEdit() {
    setEditingId(null);
    setNewPassword("");
  }

  async function savePassword(id: string) {
    if (newPassword.length < 4) {
      alert("Passwort muss mindestens 4 Zeichen lang sein.");
      return;
    }
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/wgs/${id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        alert(data.error ?? "Fehler beim Speichern.");
        return;
      }
      cancelEdit();
      load();
    } finally {
      setBusy(null);
    }
  }

  async function clearPassword(id: string, name: string) {
    if (!confirm(`Passwort fuer ${name} wirklich entfernen?`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/wgs/${id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      if (!res.ok) {
        alert("Fehler beim Entfernen.");
        return;
      }
      load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
        <p className="text-sm text-gray-500">Lade...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <h1 className="mb-1 font-display font-bold uppercase tracking-wider text-3xl text-accent">WG-Passwoerter</h1>
      <p className="mb-6 text-xs text-gray-500">
        Setzt das Passwort fuer den jeweiligen privaten "Meine WG"-Bereich.
        Mindestens 4 Zeichen.
      </p>

      <div className="space-y-3">
        {wgs.map((w) => {
          const isEditing = editingId === w.id;
          return (
            <div
              key={w.id}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white">{w.name}</p>
                  <p className="font-mono text-[10px] text-gray-500">
                    {w.floor === 0 ? "EG" : `${w.floor}. OG`} ·{" "}
                    {w.side === "NORD" ? "Nord" : "Ost"} · /meine-wg/{w.slug}
                  </p>
                  {w.hasPassword ? (
                    <p className="mt-1 text-[10px] text-emerald-400">
                      ✓ Passwort gesetzt
                      {w.passwordSetBy ? ` von ${w.passwordSetBy}` : ""}
                      {w.passwordSetAt
                        ? ` am ${new Date(w.passwordSetAt).toLocaleDateString(
                            "de-CH"
                          )}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-amber-400">
                      ⚠ Noch kein Passwort
                    </p>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => startEdit(w.id)}
                      className="rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20"
                    >
                      {w.hasPassword ? "Aendern" : "Setzen"}
                    </button>
                    {w.hasPassword && (
                      <button
                        onClick={() => clearPassword(w.id, w.name)}
                        disabled={busy === w.id}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="mt-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3">
                  <input
                    type="password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Neues Passwort"
                    className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:border-secondary focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => savePassword(w.id)}
                      disabled={busy === w.id || newPassword.length < 4}
                      className="rounded bg-secondary px-3 py-1 font-mono text-[10px] font-bold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      {busy === w.id ? "..." : "Speichern"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded px-3 py-1 text-[10px] text-gray-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
