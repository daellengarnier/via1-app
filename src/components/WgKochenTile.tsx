"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Entry {
  id: string;
  slot: "lunch" | "dinner";
  time: string | null;
  menu: string | null;
  cook: { id: string; name: string } | null;
  total: number;
  myStatus: "going" | "declined" | null;
  meIsCook: boolean;
  myChildrenIds: string[];
  myGuests: number;
}

interface DayDto {
  date: string;
  lunch: Entry | null;
  dinner: Entry | null;
}

interface Data {
  wg: { id: string; name: string; slug: string } | null;
  unlocked?: boolean;
  today?: string;
  days?: DayDto[];
}

const SLOT = {
  lunch: { label: "Mittag", icon: "🥗" },
  dinner: { label: "Abend", icon: "🍝" },
} as const;

const LS_KEY = "via1-home-wg-kochen";

function readCache(): Data | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Data) : null;
  } catch {
    return null;
  }
}

function writeCache(d: Data): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {
    // Quota
  }
}

// "Heute" / "Morgen" / "Do 3. Okt" — relativ zum effektiven Kochtag.
function dayLabel(dateIso: string, todayIso: string | undefined): string {
  if (!todayIso) return dateIso;
  const today = new Date(`${todayIso}T00:00:00Z`);
  const d = new Date(`${dateIso}T00:00:00Z`);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Morgen";
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// Home-Kachel "Kochplan" fuer die eigene WG. Spiegelt die Logik der
// WG-Uebersicht (KochSlotMini) und nutzt dieselben Kochplan-Endpoints.
// Ohne WG-Unlock zeigt sie nur den Hinweis zum Entsperren.
export function WgKochenTile({ days = 1 }: { days?: number }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(() => readCache());
  const [busy, setBusy] = useState(false);
  // Datum, fuer das das "Ich koche"-Formular offen ist
  const [cookOpenDate, setCookOpenDate] = useState<string | null>(null);
  const [menu, setMenu] = useState("");
  const [time, setTime] = useState("19:00");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/home/wg-kochen?days=${days}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const d = (await res.json()) as Data;
      setData(d);
      writeCache(d);
    } catch {
      // ignore — Cache bleibt stehen
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data || !data.wg) return null;
  const wg = data.wg;
  const kochplanHref = `/meine-wg/${wg.slug}/kochplan`;
  const dayList = (data.days ?? []).slice(0, days);

  async function signup(entry: Entry, status: "going" | "declined") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/meine-wg/${wg.slug}/kochplan/eintraege/${entry.id}/signup`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            childrenIds: entry.myChildrenIds,
            guests: entry.myGuests,
          }),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        alert(d.error ?? "Konnte nicht speichern.");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function ichKoche(date: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/meine-wg/${wg.slug}/kochplan/eintraege`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot: "dinner",
          selfCook: true,
          time: time || null,
          menu: menu.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        alert(d.error ?? "Konnte Eintrag nicht anlegen.");
      }
      setCookOpenDate(null);
      setMenu("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="wg-glow-border mb-5 rounded-2xl border border-emerald-500/25 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={{ ["--tile-glow-rgb" as string]: "52, 211, 153" }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <button
          type="button"
          onClick={() => router.push(kochplanHref)}
          className="font-display text-[9px] font-bold uppercase tracking-widest text-emerald-300"
        >
          🍳 Kochplan · {wg.name}
        </button>
        <button
          type="button"
          onClick={() => router.push(kochplanHref)}
          className="font-mono text-[9px] uppercase tracking-wider text-gray-500 hover:text-white"
        >
          ganze Woche →
        </button>
      </div>

      {!data.unlocked ? (
        <button
          type="button"
          onClick={() => router.push(`/meine-wg/${wg.slug}`)}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-700 bg-black/30 px-3 py-2 text-left hover:bg-black/40"
        >
          <span className="text-xs text-gray-400">
            WG einmal entsperren, dann siehst du hier, wer kocht und wer dabei ist.
          </span>
          <span className="ml-3 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Entsperren →
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          {dayList.map((day) => (
            <div key={day.date} className="space-y-2">
              {dayList.length > 1 && (
                <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                  {dayLabel(day.date, data.today)}
                </p>
              )}
              {day.lunch && (
                <EntryRow
                  entry={day.lunch}
                  busy={busy}
                  onSignup={signup}
                  onOpen={() => router.push(kochplanHref)}
                />
              )}
              {day.dinner ? (
                <EntryRow
                  entry={day.dinner}
                  busy={busy}
                  onSignup={signup}
                  onOpen={() => router.push(kochplanHref)}
                />
              ) : cookOpenDate === day.date ? (
                <div className="rounded-lg border border-emerald-500/30 bg-black/30 p-2">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                    {SLOT.dinner.icon} {SLOT.dinner.label} ·{" "}
                    {dayLabel(day.date, data.today)} · du kochst
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={menu}
                      onChange={(e) => setMenu(e.target.value)}
                      placeholder="Was gibt's? (optional)"
                      className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-emerald-400 focus:outline-none"
                      autoFocus
                    />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-24 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => ichKoche(day.date)}
                      disabled={busy}
                      className="flex-1 rounded-md bg-emerald-400 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-black disabled:opacity-50"
                    >
                      Eintragen
                    </button>
                    <button
                      type="button"
                      onClick={() => setCookOpenDate(null)}
                      className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-700 bg-black/30 px-3 py-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                      {SLOT.dinner.icon} {SLOT.dinner.label}
                    </p>
                    <p className="text-xs italic text-gray-500">niemand kocht</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCookOpenDate(day.date)}
                    className="rounded-md bg-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-90"
                  >
                    🍳 Ich koche
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  busy,
  onSignup,
  onOpen,
}: {
  entry: Entry;
  busy: boolean;
  onSignup: (entry: Entry, status: "going" | "declined") => void;
  onOpen: () => void;
}) {
  const slot = SLOT[entry.slot];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
          {slot.icon} {slot.label}
          {entry.time && <span className="ml-1 text-gray-500">{entry.time}</span>}
          <span className="ml-2 text-gray-500">
            · <span className="font-bold text-white">{entry.total}</span> dabei
          </span>
        </p>
        <p className="truncate text-sm font-medium text-white">
          {entry.menu ?? <span className="italic text-gray-500">Menü offen</span>}
        </p>
        {entry.cook && (
          <p className="text-[10px] text-gray-500">
            🍳 {entry.meIsCook ? "Du kochst" : entry.cook.name}
          </p>
        )}
      </button>
      {!entry.meIsCook && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onSignup(entry, "going")}
            disabled={busy}
            title="Bin dabei"
            className={`h-8 w-9 rounded-md font-mono text-[12px] font-bold transition-colors disabled:opacity-50 ${
              entry.myStatus === "going"
                ? "border border-green-400/60 bg-green-500/30 text-green-100"
                : "border border-gray-700 text-gray-300 hover:border-green-500/60 hover:bg-green-500/10"
            }`}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => onSignup(entry, "declined")}
            disabled={busy}
            title="Nicht dabei"
            className={`h-8 w-9 rounded-md font-mono text-[12px] font-bold transition-colors disabled:opacity-50 ${
              entry.myStatus === "declined"
                ? "border border-red-400/60 bg-red-500/30 text-red-100"
                : "border border-gray-700 text-gray-300 hover:border-red-500/60 hover:bg-red-500/10"
            }`}
          >
            ✗
          </button>
        </div>
      )}
    </div>
  );
}
