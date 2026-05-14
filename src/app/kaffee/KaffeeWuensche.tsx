"use client";

import { useCallback, useEffect, useState } from "react";

type Kind = "liked" | "want_to_try";

interface Wunsch {
  id: string;
  kaffeeName: string;
  notes: string;
  shopUrl: string | null;
  kind: Kind;
  createdAt: string;
  createdBy: { id: string; name: string; avatar: string | null };
}

interface Props {
  myUserId: string;
  isAdmin: boolean;
}

const KIND_META: Record<Kind, { label: string; emoji: string; cls: string }> = {
  liked: {
    label: "Hat geschmeckt",
    emoji: "😋",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  want_to_try: {
    label: "Will probieren",
    emoji: "✨",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
};

// Sektion auf /kaffee: Liste aller Kaffeewuensche + Form zum Erfassen.
// Sichtbar fuer alle, nur Ersteller + Admin koennen loeschen.
export function KaffeeWuensche({ myUserId, isAdmin }: Props) {
  const [list, setList] = useState<Wunsch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [kaffeeName, setKaffeeName] = useState("");
  const [notes, setNotes] = useState("");
  const [shopUrl, setShopUrl] = useState("");
  const [kind, setKind] = useState<Kind>("want_to_try");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kaffee/wunsch");
      if (res.ok) setList((await res.json()) as Wunsch[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kaffeeName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kaffee/wunsch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaffeeName: kaffeeName.trim(),
          notes: notes.trim(),
          shopUrl: shopUrl.trim() || null,
          kind,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Konnte Wunsch nicht speichern.");
        return;
      }
      setKaffeeName("");
      setNotes("");
      setShopUrl("");
      setKind("want_to_try");
      setShowForm(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Wunsch "${name}" loeschen?`)) return;
    const res = await fetch(`/api/kaffee/wunsch/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Loeschen fehlgeschlagen.");
      return;
    }
    load();
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">
          💭 Kaffeewuensche
        </h2>
        <a
          href="https://www.rastshop.ch/de"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] uppercase tracking-wider text-amber-400 hover:text-amber-200"
        >
          🛒 Rast-Shop ↗
        </a>
      </div>
      <p className="mb-3 text-xs text-gray-500">
        Hat dir ein Kaffee besonders geschmeckt oder willst du etwas Neues
        ausprobieren? Trag's hier ein — Daellen schaut bei der naechsten
        Bestellung drauf.
      </p>

      {loading ? (
        <p className="text-xs text-gray-500">Lade...</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-800 p-4 text-center text-xs italic text-gray-600">
          Noch keine Wuensche. Du machst den Anfang?
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((w) => {
            const meta = KIND_META[w.kind];
            const canDelete = isAdmin || w.createdBy.id === myUserId;
            return (
              <div
                key={w.id}
                className="rounded-lg border border-amber-600/20 bg-black/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.cls}`}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">
                        von {w.createdBy.name}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-amber-100">
                      {w.kaffeeName}
                    </p>
                    {w.notes && (
                      <p className="mt-0.5 whitespace-pre-line text-xs text-gray-400">
                        {w.notes}
                      </p>
                    )}
                    {w.shopUrl && (
                      <a
                        href={w.shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block font-mono text-[10px] text-amber-400 hover:text-amber-200"
                      >
                        🔗 Link
                      </a>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => del(w.id, w.kaffeeName)}
                      className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-amber-600/40 bg-amber-600/5 p-3 font-mono text-xs font-semibold uppercase tracking-wider text-amber-200 hover:border-amber-500 hover:bg-amber-600/10"
        >
          + Kaffeewunsch hinzufuegen
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="mt-3 rounded-lg border border-amber-600/40 bg-amber-600/5 p-3"
        >
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            {(Object.keys(KIND_META) as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-lg border py-1.5 font-mono text-[10px] uppercase tracking-wider ${
                  kind === k
                    ? KIND_META[k].cls
                    : "border-gray-700 bg-black/20 text-gray-400 hover:text-white"
                }`}
              >
                {KIND_META[k].emoji} {KIND_META[k].label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={kaffeeName}
            onChange={(e) => setKaffeeName(e.target.value)}
            placeholder="Kaffee-Name (z.B. 'Brasil Cerrado')"
            maxLength={100}
            className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            required
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notizen (z.B. 'hat mir bei Pina geschmeckt', 'laut Rast bluetenotig')"
            maxLength={500}
            rows={2}
            className="mb-2 w-full resize-none rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
          />
          <input
            type="url"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            placeholder="Link auf rastshop.ch (optional)"
            className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !kaffeeName.trim()}
              className="flex-1 rounded bg-amber-500 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-dark hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "..." : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-gray-700 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
