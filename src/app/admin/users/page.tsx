"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AdminUser {
  id: string;
  name: string;
  fullName: string;
  email: string;
  roles: string[];
  passwordSet: boolean;
  hasSetupToken: boolean;
  setupToken: string | null;
  createdAt: string;
  updatedAt: string;
  wgName: string | null;
  roomKey: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [resetResult, setResetResult] = useState<{
    userId: string;
    url: string;
  } | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  // Neuen User anlegen
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isAdmin = (session?.user?.roles || []).includes("ADMIN");

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setError("Nur Admins können diese Seite öffnen.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AdminUser[];
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Users laden", err);
      setError("Konnte User nicht laden.");
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
    loadUsers();
  }, [status, session, router, loadUsers]);

  async function resetPassword(user: AdminUser) {
    if (
      !confirm(
        `Passwort-Reset für ${user.name} (${user.email}) erzeugen?\n\n` +
          `Der User kann sich danach nicht mehr mit dem alten Passwort einloggen und bekommt einen neuen Setup-Link.`
      )
    ) {
      return;
    }
    setResetting(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { token: string; path: string };
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setResetResult({ userId: user.id, url: `${origin}${data.path}` });
      // User-Liste neu laden (passwordSet/hasSetupToken aktualisieren)
      loadUsers();
    } catch (err) {
      console.error("Passwort-Reset", err);
      alert("Konnte Passwort-Reset nicht erzeugen.");
    } finally {
      setResetting(null);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setCreateError(data.error ?? "Konnte User nicht anlegen.");
        setCreating(false);
        return;
      }
      const data = (await res.json()) as {
        id: string;
        path: string;
      };
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setResetResult({ userId: data.id, url: `${origin}${data.path}` });
      setNewName("");
      setNewEmail("");
      setShowCreate(false);
      loadUsers();
    } catch (err) {
      console.error("createUser", err);
      setCreateError("Netzwerkfehler.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteUser(id: string, name: string) {
    if (
      !confirm(
        `User "${name}" wirklich löschen?\n\nAlle von diesem User erstellten Inhalte (Termine, Aufgaben, Inserate etc.) werden ebenfalls gelöscht.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Löschen fehlgeschlagen.");
        return;
      }
      loadUsers();
    } catch (err) {
      console.error("deleteUser", err);
      alert("Netzwerkfehler.");
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link kopiert");
    } catch {
      alert("Konnte nicht kopieren — bitte manuell markieren.");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-6 pb-24">
        <p className="text-center text-sm text-gray-500">Lade …</p>
      </div>
    );
  }

  if (!isAdmin || error) {
    return (
      <div className="p-6 pb-24">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-500 hover:text-white"
        >
          ← Zurück
        </button>
        <p className="text-center text-sm text-red-400">
          {error ?? "Nur Admins können diese Seite öffnen."}
        </p>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const registered = users.filter((u) => u.passwordSet).length;
  const pending = users.filter((u) => !u.passwordSet).length;

  return (
    <div className="p-4 pb-24">
      <button
        onClick={() => router.back()}
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
      >
        ← Zurück
      </button>

      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">
        User-Verwaltung
      </h1>
      <p className="mb-4 text-center text-sm text-accent/70">
        Übersicht aller User · Passwort-Reset
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-accent">
            {users.length}
          </p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-emerald-400">
            {registered}
          </p>
          <p className="text-[10px] text-gray-500">registriert</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-center">
          <p className="font-mono text-xl font-bold text-amber-400">
            {pending}
          </p>
          <p className="text-[10px] text-gray-500">ausstehend</p>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen (Name, E-Mail)..."
        className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
      />

      <div className="mb-4">
        {!showCreate ? (
          <button
            onClick={() => {
              setShowCreate(true);
              setCreateError(null);
            }}
            className="w-full rounded-lg border border-accent/40 bg-accent/10 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-accent hover:bg-accent/20"
          >
            + Neuen User anlegen
          </button>
        ) : (
          <form
            onSubmit={createUser}
            className="rounded-lg border border-accent/40 bg-accent/5 p-3"
          >
            <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
              NEUER USER
            </p>
            <div className="mb-2">
              <label className="mb-1 block text-[10px] text-gray-400">
                Anzeigename
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Ambar"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div className="mb-2">
              <label className="mb-1 block text-[10px] text-gray-400">
                E-Mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="z.B. ambar.conca@gmail.com"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
            {createError && (
              <p className="mb-2 text-xs text-red-400">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 rounded bg-accent py-2 font-mono text-xs font-bold text-dark disabled:opacity-50"
              >
                {creating ? "…" : "Anlegen & Setup-Link erzeugen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setNewEmail("");
                  setCreateError(null);
                }}
                className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white"
              >
                Abbrechen
              </button>
            </div>
            <p className="mt-2 text-[10px] text-gray-500">
              Der User bekommt einen Setup-Link, mit dem er sein Passwort
              und Profil einrichten kann.
            </p>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((u) => {
          const resultForUser =
            resetResult && resetResult.userId === u.id
              ? resetResult
              : null;
          return (
            <div
              key={u.id}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {u.name}
                    {u.fullName && u.fullName !== u.name && (
                      <span className="ml-1.5 text-xs text-gray-500">
                        ({u.fullName})
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-400">{u.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {u.passwordSet ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
                        ✓ REGISTRIERT
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 ring-1 ring-amber-500/40">
                        AUSSTEHEND
                      </span>
                    )}
                    {u.hasSetupToken && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-300 ring-1 ring-blue-500/40">
                        Setup-Link aktiv
                      </span>
                    )}
                    {u.roles.includes("ADMIN") && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[9px] font-bold text-accent ring-1 ring-accent/40">
                        ADMIN
                      </span>
                    )}
                    {u.wgName && (
                      <span className="font-mono text-[10px] text-gray-500">
                        {u.wgName}
                        {u.roomKey && ` · ${u.roomKey}`}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-gray-600">
                    Erstellt:{" "}
                    {new Date(u.createdAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => resetPassword(u)}
                    disabled={resetting === u.id}
                    className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-200 hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    {resetting === u.id ? "…" : "Reset"}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Reset-Resultat: Link anzeigen + Kopieren */}
              {resultForUser && (
                <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5">
                  <p className="mb-1 font-display text-[9px] font-bold uppercase tracking-widest text-blue-300">
                    NEUER SETUP-LINK
                  </p>
                  <p className="mb-2 break-all font-mono text-[10px] text-blue-200">
                    {resultForUser.url}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => copyToClipboard(resultForUser.url)}
                      className="rounded bg-blue-500 px-3 py-1 font-mono text-[10px] font-bold text-white hover:brightness-110"
                    >
                      Kopieren
                    </button>
                    <button
                      onClick={() => setResetResult(null)}
                      className="rounded px-3 py-1 text-[10px] text-gray-400 hover:text-white"
                    >
                      Schliessen
                    </button>
                  </div>
                  <p className="mt-1.5 text-[9px] text-gray-500">
                    Diesen Link dem User senden (z.B. per WhatsApp). Der
                    User kann damit ein neues Passwort setzen.
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-600">
            Keine User gefunden.
          </p>
        )}
      </div>
    </div>
  );
}
