"use client";

import { useState } from "react";
import { usePutzplan } from "@/lib/putzplan-store";

// Sanfte Sprueche: lustig, nicht auffordernd. Werden immer gezeigt.
const gentleMessages = [
  "Wer macht's diesmal mit Cocktail? 🍸",
  "Treppenhaus-Aerobic ruft 🧽",
  "Heute mal mit Musik im Ohr putzen — geht schneller 🎧",
  "Frueh dran ist halb gewonnen 🌱",
  "Wischmopp-Yoga kann auch Spass machen 🧘",
  "Putzen mit Aussicht — die Spinnerei dankt's 🪟",
  "Saubere Treppen, sauberes Karma 💚",
  "Der Tag wartet auf die Putzaktion ☀️",
];

// Auffordernde Sprueche: erst nach 30 Tagen ohne Putz-Aktivitaet.
const nudgeMessages = [
  "Das Treppenhaus versinkt im Dreck! 🧹",
  "Hier wachsen bald Pilze im Gang... 🍄",
  "Die Staubmäuse haben eigene WGs gegründet 🐭",
  "Wann wurde hier zuletzt geputzt? Archäologen rätseln... 🏺",
  "Die Waschküche hat sich selbständig gemacht 🧟",
  "Houston, wir haben ein Hygiene-Problem 🚀",
  "Sogar der Staubsauger hat aufgegeben 😤",
  "Ein Putzfee wurde gesichtet – ach nein, doch nur eine Staubwolke ☁️",
];

function daysSince(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function pickMessage(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length]!;
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function ninetyDaysAgoIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 90);
  return d.toISOString().slice(0, 10);
}

function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PutzplanPage() {
  const [rotation, markComplete, , loading] = usePutzplan();
  const [confirmed, setConfirmed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState<string>(todayIso());

  const currentIndex = rotation.findIndex((r) => r.completedAt === null);
  const currentWg = currentIndex >= 0 ? rotation[currentIndex]! : null;

  const lastCompleted = [...rotation]
    .filter((r) => r.completedAt !== null)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  const lastCompletedDate = lastCompleted[0]?.completedAt;
  const daysSinceLastClean = lastCompletedDate
    ? daysSince(lastCompletedDate)
    : 999;
  const overOneMonth = daysSinceLastClean > 30;

  // Stabiler "Random"-Seed pro Tag, damit der Spruch nicht bei jedem Klick wechselt
  const seed =
    Math.floor(Date.now() / (24 * 60 * 60 * 1000)) +
    (currentWg ? currentWg.wg.length : 0);
  const gentleSpruch = pickMessage(gentleMessages, seed);
  const nudgeSpruch = overOneMonth ? pickMessage(nudgeMessages, seed) : null;

  async function handleComplete() {
    if (!currentWg || confirmed) return;
    setConfirmed(true);

    // Nur ein Datum mitschicken wenn der User wirklich rueckwirkend gewaehlt hat
    const completedAt =
      showDatePicker && pickedDate && pickedDate !== todayIso()
        ? pickedDate
        : undefined;
    await markComplete(currentWg.wg, completedAt);

    // Nächste WG benachrichtigen
    const res = await fetch("/api/putzplan");
    if (res.ok) {
      const updated = (await res.json()) as { wg: string; completedAt: string | null }[];
      const nextIdx = updated.findIndex((r) => r.completedAt === null);
      if (nextIdx >= 0) {
        const nextWg = updated[nextIdx]!.wg;
        fetch("/api/notifications/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "PUTZPLAN_MY_WG",
            title: "Eure WG ist mit Putzen dran 🧹",
            body: `${nextWg} — das gemeinsame Putzen wartet.`,
            link: "/putzplan",
            wg: nextWg,
          }),
        }).catch(() => {});
      }
    }

    setShowDatePicker(false);
    setPickedDate(todayIso());
    setTimeout(() => setConfirmed(false), 1500);
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <h1 className="mb-6 text-center font-cinzel text-3xl text-accent">
          Putzdienst
        </h1>
        <p className="text-center text-sm text-gray-600">Lade…</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-6 text-center font-cinzel text-3xl text-accent">
        Putzdienst
      </h1>

      {/* Aktuell dran */}
      {currentWg && (
        <div
          className={`mb-6 rounded-lg border-2 p-5 ${
            overOneMonth
              ? "border-secondary bg-secondary/10"
              : "border-accent bg-accent/10"
          }`}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Gerade dran
          </p>
          <p className="mt-1 text-3xl font-bold text-white">
            {currentWg.wg}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Treppenhaus + Waschküche
          </p>

          {/* Sanfter Spruch — immer sichtbar, nicht auffordernd */}
          <p className="mt-3 rounded-lg bg-accent/10 p-3 text-sm text-accent/90">
            {gentleSpruch}
          </p>

          {/* Auffordernder Spruch — erst ab >30 Tagen ohne Putz-Aktivitaet */}
          {nudgeSpruch && (
            <p className="mt-2 rounded-lg bg-secondary/20 p-3 text-sm text-secondary">
              {nudgeSpruch}
            </p>
          )}

          {lastCompletedDate ? (
            <p className="mt-3 rounded-md bg-black/30 px-3 py-2 text-sm text-gray-300">
              <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                Zuletzt geputzt
              </span>
              <br />
              {fmtDateLong(lastCompletedDate)}
              <span className="text-gray-500">
                {" "}
                · vor{" "}
                {daysSinceLastClean === 0
                  ? "heute"
                  : daysSinceLastClean === 1
                    ? "1 Tag"
                    : `${daysSinceLastClean} Tagen`}
              </span>
            </p>
          ) : (
            <p className="mt-3 text-xs italic text-gray-600">
              Noch keine Putzaktion in dieser Runde erfasst
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={confirmed}
            className={`mt-4 w-full rounded-lg py-3 font-mono text-sm font-bold transition-all ${
              confirmed
                ? "bg-accent/20 text-accent"
                : "bg-accent text-dark hover:brightness-110"
            }`}
          >
            {confirmed
              ? "✓ Erledigt!"
              : showDatePicker && pickedDate !== todayIso()
                ? `Erledigt am ${fmtDateLong(pickedDate)}`
                : "Als erledigt markieren"}
          </button>

          {/* Rueckwirkend-Datum-Auswahl */}
          {!showDatePicker ? (
            <button
              onClick={() => setShowDatePicker(true)}
              className="mt-2 block w-full text-center font-mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-accent"
            >
              ↻ Anderes Datum waehlen (rueckwirkend)
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-accent/30 bg-black/30 p-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-gray-400">
                Datum:
              </label>
              <input
                type="date"
                value={pickedDate}
                min={ninetyDaysAgoIso()}
                max={todayIso()}
                onChange={(e) => setPickedDate(e.target.value || todayIso())}
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  setPickedDate(todayIso());
                }}
                className="text-xs text-gray-500 hover:text-white"
                title="Zuruecksetzen auf heute"
              >
                ✕
              </button>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-gray-600">
            Nur Bewohner:innen der {currentWg.wg} können abkreuzen
          </p>
        </div>
      )}

      {!currentWg && rotation.length > 0 && (
        <div className="mb-6 rounded-lg border border-accent bg-accent/10 p-5 text-center">
          <p className="text-xl font-bold text-accent">Alle durch!</p>
          <p className="mt-1 text-sm text-gray-400">
            Neue Runde startet automatisch
          </p>
        </div>
      )}

      {/* Tournus */}
      <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
        Tournus
      </h2>
      <div className="space-y-2">
        {rotation.map((r, i) => {
          const isCurrent = i === currentIndex;
          const isDone = r.completedAt !== null;
          const isPending = !isDone && !isCurrent;

          return (
            <div
              key={r.wg}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                isCurrent
                  ? "border-accent bg-accent/5"
                  : isDone
                    ? "border-gray-800 bg-gray-900/40 opacity-60"
                    : "border-gray-800 bg-gray-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-accent/20 text-accent"
                      : isCurrent
                        ? "bg-accent text-dark"
                        : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    isCurrent
                      ? "font-bold text-white"
                      : isDone
                        ? "text-gray-500 line-through"
                        : "text-gray-400"
                  }`}
                >
                  {r.wg}
                </span>
              </div>
              <div className="text-right">
                {isDone && r.completedAt && (
                  <span className="font-mono text-xs text-gray-600">
                    {new Date(r.completedAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                {isCurrent && (
                  <span className="font-mono text-xs text-accent">dran</span>
                )}
                {isPending && (
                  <span className="font-mono text-xs text-gray-600">
                    wartet
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
