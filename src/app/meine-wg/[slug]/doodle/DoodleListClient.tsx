"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WgPageHeader } from "@/components/WgPageHeader";

interface DoodleListItem {
  id: string;
  title: string;
  finalized: boolean;
  finalizedDate: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  optionCount: number;
  totalVotes: number;
}

interface Props {
  slug: string;
  wgName: string;
}

export function DoodleListClient({ slug, wgName }: Props) {
  const [items, setItems] = useState<DoodleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/doodle`);
      if (!res.ok) return;
      setItems((await res.json()) as DoodleListItem[]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const open = items.filter((i) => !i.finalized);
  const done = items.filter((i) => i.finalized);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="🗓 Termin-Doodle"
        subtitle="Mehrere Datums-Optionen vorschlagen, abstimmen, finalisieren"
      />
      <div className="mb-4 mt-3 flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg border border-white/30 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/15"
        >
          + Doodle
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Lade...</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-800 px-3 py-8 text-center text-xs italic text-gray-600">
          Noch keine Doodles. Erstelle einen mit dem Button oben.
        </p>
      ) : (
        <>
          {open.length > 0 && (
            <div className="mb-4 space-y-2">
              {open.map((d) => (
                <DoodleRow key={d.id} d={d} slug={slug} />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <>
              <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                Finalisiert
              </p>
              <div className="space-y-2 opacity-60">
                {done.map((d) => (
                  <DoodleRow key={d.id} d={d} slug={slug} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showAdd && (
        <AddDoodleModal
          slug={slug}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function DoodleRow({ d, slug }: { d: DoodleListItem; slug: string }) {
  return (
    <Link
      href={`/meine-wg/${slug}/doodle/${d.id}`}
      className={`block rounded-xl border bg-gray-900/40 p-3 hover:border-white/50 ${
        d.finalized ? "border-gray-800" : "wg-glow-border border-white/15"
      }`}
    >
      <p className="font-medium text-white">{d.title}</p>
      <p className="text-[11px] text-gray-500">
        {d.optionCount} Optionen · {d.totalVotes} Stimmen · von {d.createdBy.name}
      </p>
      {d.finalized && d.finalizedDate && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white">
          ✓ Finalisiert:{" "}
          {new Date(d.finalizedDate).toLocaleString("de-CH", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </Link>
  );
}

function AddDoodleModal({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [options, setOptions] = useState<{ date: string; time: string }[]>([
    { date: "", time: "19:00" },
    { date: "", time: "19:00" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setOption(i: number, patch: Partial<{ date: string; time: string }>) {
    setOptions((cur) =>
      cur.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
    );
  }

  function addOption() {
    setOptions((cur) => [...cur, { date: "", time: "19:00" }]);
  }

  function removeOption(i: number) {
    setOptions((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!title.trim()) {
      setError("Titel fehlt.");
      return;
    }
    const isoOptions = options
      .filter((o) => o.date)
      .map((o) => new Date(`${o.date}T${o.time || "19:00"}`).toISOString());
    if (isoOptions.length < 2) {
      setError("Mindestens 2 Datums-Optionen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/doodle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          duration: duration ? parseInt(duration, 10) : null,
          options: isoOptions,
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        setError(b.error ?? "Fehler.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-display font-bold uppercase tracking-wider text-lg text-white">Neuer Doodle</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (z.B. WG-Sitzung Januar)"
          autoFocus
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ort (optional)"
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Dauer in Min (optional)"
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Beschreibung (optional)"
          className="mb-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />

        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
          Datums-Optionen
        </p>
        <div className="mb-2 space-y-1">
          {options.map((o, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="date"
                value={o.date}
                onChange={(e) => setOption(i, { date: e.target.value })}
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
              />
              <input
                type="time"
                value={o.time}
                onChange={(e) => setOption(i, { time: e.target.value })}
                className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  className="text-xs text-gray-600 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mb-3 w-full rounded border border-dashed border-gray-700 px-3 py-1.5 font-mono text-[10px] uppercase text-gray-400 hover:border-white/50 hover:text-white"
        >
          + Option
        </button>

        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
          >
            {busy ? "..." : "Erstellen"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
