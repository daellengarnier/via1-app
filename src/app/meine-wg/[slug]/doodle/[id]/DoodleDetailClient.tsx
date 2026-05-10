"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Voter {
  id: string;
  name: string;
  avatar: string | null;
}

interface Option {
  id: string;
  date: string;
  voters: Voter[];
}

interface Doodle {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  duration: number | null;
  finalized: boolean;
  finalizedDate: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
  options: Option[];
}

interface Props {
  slug: string;
  wgName: string;
  doodleId: string;
  meId: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DoodleDetailClient({ slug, wgName, doodleId, meId }: Props) {
  const router = useRouter();
  const [d, setD] = useState<Doodle | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/doodle/${doodleId}`);
      if (!res.ok) return;
      setD((await res.json()) as Doodle);
    } finally {
      setLoading(false);
    }
  }, [slug, doodleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVote(optionId: string) {
    if (!d || d.finalized) return;
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/doodle/${doodleId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function finalize(optionId: string) {
    if (!confirm("Diese Option als Termin festlegen? Erstellt einen WG-Termin.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/meine-wg/${slug}/doodle/${doodleId}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        }
      );
      if (res.ok) {
        const body = (await res.json()) as { terminId?: string };
        if (body.terminId) {
          router.push(`/meine-wg/${slug}/termine/${body.terminId}`);
          return;
        }
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoodle() {
    if (!confirm("Doodle wirklich loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/doodle/${doodleId}`, {
      method: "DELETE",
    });
    router.push(`/meine-wg/${slug}/doodle`);
  }

  const sortedOptions = useMemo(() => {
    if (!d) return [];
    return [...d.options].sort((a, b) => b.voters.length - a.voters.length);
  }, [d]);

  if (loading || !d) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
        <p className="text-sm text-gray-500">Lade Doodle...</p>
      </div>
    );
  }

  const maxVotes = Math.max(0, ...d.options.map((o) => o.voters.length));

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <Link
        href={`/meine-wg/${slug}/doodle`}
        className="font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-accent"
      >
        ← {wgName} · Doodles
      </Link>
      <div className="mb-4 mt-1 flex items-start justify-between gap-2">
        <h1 className="font-cinzel text-2xl text-accent">{d.title}</h1>
        <button
          onClick={deleteDoodle}
          className="text-xs text-gray-500 hover:text-red-400"
        >
          ✕
        </button>
      </div>

      {d.description && (
        <p className="mb-2 whitespace-pre-line text-sm text-gray-300">
          {d.description}
        </p>
      )}
      {(d.location || d.duration) && (
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gray-500">
          {d.location && <>📍 {d.location}</>}
          {d.location && d.duration && " · "}
          {d.duration && <>⏱ {d.duration} Min</>}
        </p>
      )}

      {d.finalized && d.finalizedDate && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            ✓ Finalisiert
          </p>
          <p className="text-sm text-white">{fmtDate(d.finalizedDate)}</p>
        </div>
      )}

      <div className="space-y-2">
        {sortedOptions.map((o) => {
          const meVoted = o.voters.some((v) => v.id === meId);
          const isWinner = !d.finalized && o.voters.length === maxVotes && maxVotes > 0;
          return (
            <div
              key={o.id}
              className={`rounded-xl border p-3 ${
                isWinner
                  ? "border-accent/40 bg-accent/5"
                  : "border-gray-800 bg-gray-900/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white">{fmtDate(o.date)}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-gray-300">
                    {o.voters.length}
                  </span>
                  {!d.finalized && (
                    <button
                      onClick={() => toggleVote(o.id)}
                      disabled={busy}
                      className={`rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        meVoted
                          ? "border border-accent/50 bg-accent/10 text-accent"
                          : "bg-accent text-black hover:brightness-110"
                      } disabled:opacity-50`}
                    >
                      {meVoted ? "✓ kann" : "kann"}
                    </button>
                  )}
                </div>
              </div>
              {o.voters.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.voters.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] text-gray-300"
                    >
                      {v.name}
                    </span>
                  ))}
                </div>
              )}
              {!d.finalized && o.voters.length > 0 && (
                <button
                  onClick={() => finalize(o.id)}
                  disabled={busy}
                  className="mt-2 w-full rounded border border-secondary/40 bg-secondary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20 disabled:opacity-50"
                >
                  → als Termin festlegen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
