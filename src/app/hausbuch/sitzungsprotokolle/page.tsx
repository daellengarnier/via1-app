"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Protokoll {
  id: string;
  title: string;
  date: string;
  wgName: string | null;
  terminId: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export default function SitzungsprotokollePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [list, setList] = useState<Protokoll[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sitzungsprotokolle");
      if (res.ok) setList((await res.json()) as Protokoll[]);
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

  const myUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles ?? []).includes("ADMIN");

  async function del(id: string, title: string) {
    if (!confirm(`Protokoll "${title}" loeschen?`)) return;
    const res = await fetch(`/api/sitzungsprotokolle/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Loeschen fehlgeschlagen.");
      return;
    }
    load();
  }

  // Nach Jahr gruppieren — schicke Optik fuer ein wachsendes Archiv.
  const byYear = new Map<number, Protokoll[]>();
  for (const p of list) {
    const y = new Date(p.date).getFullYear();
    const arr = byYear.get(y) ?? [];
    arr.push(p);
    byYear.set(y, arr);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <Link
        href="/hausbuch"
        className="mb-3 inline-block text-sm text-gray-500 hover:text-white"
      >
        ← Zurueck zum Hausbuch
      </Link>

      <h1 className="mb-1 font-display text-3xl font-bold uppercase tracking-wider text-violet-300">
        📜 Sitzungsprotokolle
      </h1>
      <p className="mb-6 text-xs text-gray-500">
        Alle Haus-Sitzungsprotokolle, datiert und sortiert. PDFs werden
        beim Klick auf "Protokoll als PDF" auf einer Termin-Seite
        automatisch hier abgelegt.
      </p>

      {loading && <p className="text-sm text-gray-500">Lade...</p>}
      {!loading && list.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-800 p-6 text-center text-sm text-gray-600">
          Noch keine Protokolle. Beim naechsten "Protokoll als PDF" auf
          einer Termin-Seite landet's hier.
        </p>
      )}

      <div className="space-y-6">
        {years.map((y) => (
          <section key={y}>
            <h2 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-violet-400">
              {y}
            </h2>
            <div className="space-y-2">
              {byYear.get(y)!.map((p) => {
                const dateLabel = new Date(p.date).toLocaleDateString("de-CH", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                });
                const canDelete = isAdmin || p.createdBy.id === myUserId;
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-violet-300">
                          {dateLabel}
                          {p.wgName && (
                            <span className="text-gray-500"> · {p.wgName}</span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium text-white">
                          {p.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          von {p.createdBy.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <a
                          href={`/api/sitzungsprotokolle/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-200 hover:bg-violet-500/20"
                          title="PDF oeffnen"
                        >
                          📥 PDF
                        </a>
                        {canDelete && (
                          <button
                            onClick={() => del(p.id, p.title)}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
