"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WgPageHeader } from "@/components/WgPageHeader";

interface Termin {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  hasProtokoll: boolean;
  createdBy: { id: string; name: string };
  traktandenCount: number;
  commentCount: number;
}

interface Birthday {
  user: { id: string; name: string; avatar: string | null };
  date: string;
  age: number | null;
  daysUntil: number;
}

interface TermineData {
  termine: Termin[];
  birthdays: Birthday[];
}

interface DoodleListItem {
  id: string;
  title: string;
  finalized: boolean;
  finalizedDate: string | null;
  createdBy: { id: string; name: string };
  optionCount: number;
  totalVotes: number;
}

interface Props {
  slug: string;
  wgName: string;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WgTermineClient({ slug, wgName }: Props) {
  const [data, setData] = useState<TermineData | null>(null);
  const [doodles, setDoodles] = useState<DoodleListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTermin, setShowAddTermin] = useState(false);
  const [showAddDoodle, setShowAddDoodle] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        fetch(`/api/meine-wg/${slug}/termine`).then((r) =>
          r.ok ? (r.json() as Promise<TermineData>) : null
        ),
        fetch(`/api/meine-wg/${slug}/doodle`).then((r) =>
          r.ok ? (r.json() as Promise<DoodleListItem[]>) : null
        ),
      ]);
      setData(t);
      setDoodles(d);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
        <WgPageHeader
          backToWgSlug={slug}
          backToWgName={wgName}
          title="📅 Termine"
        />
        <p className="mt-4 text-sm text-gray-500">Lade...</p>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = data.termine.filter(
    (t) => new Date(t.date).getTime() >= now
  );
  const past = data.termine.filter((t) => new Date(t.date).getTime() < now);
  const openDoodles = (doodles ?? []).filter((d) => !d.finalized);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="📅 WG-Termine"
      />
      <div className="h-3" />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowAddTermin(true)}
          className="rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20"
        >
          + Termin
        </button>
        <button
          onClick={() => setShowAddDoodle(true)}
          className="rounded-lg border border-white/40 bg-white/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white/20"
        >
          🗓 + Doodle
        </button>
      </div>

      {data.birthdays.length > 0 && (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/5 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">
            🎂 Geburtstage diese Woche
          </p>
          <div className="space-y-1">
            {data.birthdays.map((b) => (
              <p key={b.user.id} className="text-sm text-white">
                <span className="font-medium">{b.user.name}</span>
                {b.age !== null && (
                  <span className="text-gray-400"> wird {b.age}</span>
                )}
                <span className="text-gray-500">
                  {" — "}
                  {b.daysUntil === 0
                    ? "heute!"
                    : b.daysUntil === 1
                      ? "morgen"
                      : `in ${b.daysUntil} Tagen`}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {openDoodles.length > 0 && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            🗓 Offene Umfragen ({openDoodles.length})
          </p>
          <div className="mb-4 space-y-2">
            {openDoodles.map((d) => (
              <DoodleRow key={d.id} doodle={d} slug={slug} />
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            Bevorstehend
          </p>
          <div className="mb-4 space-y-2">
            {upcoming.map((t) => (
              <TerminRow key={t.id} termin={t} slug={slug} />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            Vergangen
          </p>
          <div className="space-y-2 opacity-70">
            {past.map((t) => (
              <TerminRow key={t.id} termin={t} slug={slug} />
            ))}
          </div>
        </>
      )}

      {data.termine.length === 0 && openDoodles.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-800 px-3 py-8 text-center text-xs italic text-gray-600">
          Noch keine Termine oder Umfragen.
        </p>
      )}

      {showAddTermin && (
        <AddTerminModal
          slug={slug}
          onClose={() => setShowAddTermin(false)}
          onSaved={() => {
            setShowAddTermin(false);
            load();
          }}
        />
      )}

      {showAddDoodle && (
        <AddDoodleModal
          slug={slug}
          onClose={() => setShowAddDoodle(false)}
          onSaved={() => {
            setShowAddDoodle(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TerminRow({ termin, slug }: { termin: Termin; slug: string }) {
  return (
    <Link
      href={`/meine-wg/${slug}/termine/${termin.id}`}
      className="block rounded-xl border border-gray-800 bg-gray-900/40 p-3 hover:border-white/50"
    >
      <p className="font-medium text-white">{termin.title}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-secondary">
        {fmtDateTime(termin.date)}
        {termin.location && ` · ${termin.location}`}
      </p>
      <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
        {termin.traktandenCount > 0 && (
          <span>📋 {termin.traktandenCount} Traktanden</span>
        )}
        {termin.commentCount > 0 && <span>💬 {termin.commentCount}</span>}
        {termin.hasProtokoll && <span>📝 Protokoll</span>}
      </div>
    </Link>
  );
}

function DoodleRow({
  doodle,
  slug,
}: {
  doodle: DoodleListItem;
  slug: string;
}) {
  return (
    <Link
      href={`/meine-wg/${slug}/doodle/${doodle.id}`}
      className="block rounded-xl border border-white/30 bg-white/5 p-3 hover:border-white/50"
    >
      <p className="font-medium text-white">🗓 {doodle.title}</p>
      <p className="text-[11px] text-gray-500">
        {doodle.optionCount} Optionen · {doodle.totalVotes} Stimmen · von{" "}
        {doodle.createdBy.name}
      </p>
    </Link>
  );
}

function AddTerminModal({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || !date) {
      setError("Titel und Datum sind Pflicht.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dateIso = new Date(`${date}T${time || "19:00"}`).toISOString();
      const res = await fetch(`/api/meine-wg/${slug}/termine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: dateIso,
          location: location.trim() || null,
          description: description.trim() || null,
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
    <ModalShell title="Neuer Termin" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel (z.B. WG-Sitzung)"
        autoFocus
        className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
      />
      <div className="mb-2 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
        />
      </div>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Ort (optional)"
        className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Beschreibung (optional)"
        className="mb-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
      />
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
        >
          {busy ? "..." : "Anlegen"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
        >
          Abbrechen
        </button>
      </div>
    </ModalShell>
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
    <ModalShell title="Neue Umfrage (Doodle)" onClose={onClose}>
      <p className="mb-3 text-xs text-gray-500">
        Mehrere Datums-Optionen vorschlagen. Wenn alle abgestimmt haben, kann
        eine Option als Termin festgelegt werden.
      </p>

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
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-display font-bold uppercase tracking-wider text-lg text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}
