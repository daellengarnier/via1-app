"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

interface ShoppingItem {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  createdBy: string;
  createdById: string;
  completedBy: string | null;
  completedById: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function EinkaufPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"offen" | "erledigt">("offen");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/einkauf");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ShoppingItem[];
      setItems(data);
    } catch (err) {
      console.error("einkauf laden", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/einkauf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, notes: newNotes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as ShoppingItem;
      setItems((prev) => [created, ...prev]);
      setNewTitle("");
      setNewNotes("");
      setShowAdd(false);
    } catch (err) {
      console.error("einkauf erstellen", err);
      alert("Konnte Eintrag nicht erstellen.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(item: ShoppingItem) {
    try {
      const res = await fetch(`/api/einkauf/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as ShoppingItem;
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error("einkauf toggle", err);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/einkauf/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("einkauf loeschen", err);
    }
  }

  const offen = items.filter((i) => !i.done);
  const erledigt = items.filter((i) => i.done);
  const visible = filter === "offen" ? offen : erledigt;

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/icon-einkauf.webp"
        glowClass="glow-violet"
        showIcon={false}
      />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-einkauf.webp"
          alt=""
          className="tab-btn-icon glow-violet"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-violet-300">
        Einkauf
      </h1>
      <p className="mb-4 text-center text-sm text-violet-300/70">
        Was noch gebraucht wird
      </p>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-full bg-violet-500 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
        >
          + Neuer Eintrag
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={createItem}
          className="mb-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Was wird gebraucht?
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Anzündwürfel, Holzbriketts, Holz..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Notizen (optional)
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Menge, Marke, wo kaufen..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-violet-500 px-4 py-2 font-mono text-xs font-bold text-dark disabled:opacity-50"
            >
              {saving ? "…" : "Hinzufügen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewTitle("");
                setNewNotes("");
              }}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Tabs: Offen / Erledigt */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setFilter("offen")}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
            filter === "offen"
              ? "bg-violet-500 text-dark"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Offen ({offen.length})
        </button>
        <button
          onClick={() => setFilter("erledigt")}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
            filter === "erledigt"
              ? "bg-violet-500/60 text-dark"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Erledigt ({erledigt.length})
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {visible.map((item) => {
          const canDelete = item.createdById === currentUserId || isAdmin;
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-3 transition-all ${
                item.done
                  ? "border-gray-800 bg-gray-900/40 opacity-70"
                  : "border-violet-500/30 bg-violet-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDone(item)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${
                    item.done
                      ? "border-violet-400 bg-violet-500 text-white"
                      : "border-gray-600 hover:border-violet-400"
                  }`}
                  aria-label={item.done ? "Auf offen setzen" : "Als erledigt markieren"}
                >
                  {item.done && "✓"}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      item.done ? "text-gray-500 line-through" : "text-white"
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.notes && (
                    <p className="mt-0.5 text-xs text-gray-400">{item.notes}</p>
                  )}
                  <p className="mt-1 font-mono text-[9px] text-gray-600">
                    von {item.createdBy} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                    })}
                    {item.done && item.completedBy && item.completedAt && (
                      <>
                        {" · "}
                        erledigt von {item.completedBy} am{" "}
                        {new Date(item.completedAt).toLocaleDateString(
                          "de-CH",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </>
                    )}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="shrink-0 rounded px-1.5 text-[14px] leading-none text-gray-600 hover:text-red-400"
                    aria-label="Loeschen"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-600">Lade …</p>
      )}
      {!loading && visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-600">
          {filter === "offen"
            ? "Nichts auf der Liste 🎉"
            : "Noch nichts erledigt"}
        </p>
      )}
    </div>
  );
}
