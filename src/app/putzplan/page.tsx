"use client";

import { useState, useEffect } from "react";
import { usePutzplan, isRoundComplete, resetRound } from "@/lib/putzplan-store";

const funnyMessages = [
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

function getRandomMessage(seed: number): string {
  return funnyMessages[seed % funnyMessages.length]!;
}

export default function PutzplanPage() {
  const [rotation, setRotation] = usePutzplan();
  const [confirmed, setConfirmed] = useState(false);

  // Auto-Reset: wenn alle durch sind, neue Runde starten
  useEffect(() => {
    if (isRoundComplete(rotation)) {
      setRotation(resetRound(rotation));
    }
  }, [rotation, setRotation]);

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

  function handleComplete() {
    if (!currentWg || confirmed) return;
    setConfirmed(true);
  }

  useEffect(() => {
    if (!confirmed || currentIndex < 0) return;
    const timer = setTimeout(() => {
      let newRotation = rotation.map((r, i) =>
        i === currentIndex
          ? { ...r, completedAt: new Date().toISOString().split("T")[0]! }
          : r
      );
      // Wenn alle durch: neue Runde starten
      if (isRoundComplete(newRotation)) {
        newRotation = resetRound(newRotation);
      }
      setRotation(newRotation);
      setConfirmed(false);
      // Naechste WG ermitteln und benachrichtigen
      const nextIdx = newRotation.findIndex((r) => r.completedAt === null);
      if (nextIdx >= 0) {
        const nextWg = newRotation[nextIdx]!.wg;
        fetch("/api/notifications/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "PUTZPLAN_MY_WG",
            title: "Eure WG ist mit Putzen dran 🧹",
            body: `${nextWg} — das gemeinsame Putzen wartet. (Neue Runde!)`,
            link: "/putzplan",
            wg: nextWg,
          }),
        }).catch(() => {});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [confirmed, currentIndex, rotation, setRotation]);

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

          {overOneMonth && (
            <p className="mt-3 rounded-lg bg-secondary/20 p-3 text-sm text-secondary">
              {getRandomMessage(daysSinceLastClean)}
            </p>
          )}

          {lastCompletedDate && (
            <p className="mt-2 text-xs text-gray-500">
              Zuletzt geputzt: vor {daysSinceLastClean} Tagen (
              {new Date(lastCompletedDate).toLocaleDateString("de-CH", {
                day: "numeric",
                month: "long",
              })}
              )
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
            {confirmed ? "✓ Erledigt!" : "Als erledigt markieren"}
          </button>
          <p className="mt-1 text-center text-xs text-gray-600">
            Nur Bewohner:innen der {currentWg.wg} können abkreuzen
          </p>
        </div>
      )}

      {!currentWg && (
        <div className="mb-6 rounded-lg border border-accent bg-accent/10 p-5 text-center">
          <p className="text-xl font-bold text-accent">
            Alle durch!
          </p>
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
