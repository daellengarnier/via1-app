"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SpinnereiEvent {
  title: string;
  date: string;
  url: string;
}

interface PinnwandEintrag {
  id: string;
  text: string;
  author: string;
  date: string;
}

const nextSpinnereiEvent: SpinnereiEvent = {
  title: "Soirée Tropicale",
  date: "2026-04-25T21:00",
  url: "https://kulturspinnerei.ch",
};

const initialPinnwand: PinnwandEintrag[] = [
  {
    id: "1",
    text: "Grüngut-Container wird am Dienstag 15.4. geleert. Bitte bis Montag Abend alles reinwerfen!",
    author: "Marco",
    date: "2026-04-10",
  },
  {
    id: "2",
    text: "Trocknungsraum-Schlüssel ist beim Eingang an der Pinnwand. Bitte immer zurückhängen.",
    author: "Lena",
    date: "2026-04-08",
  },
  {
    id: "3",
    text: "Nächsten Samstag Gartenputzete! Wer kann mithelfen bitte bei Sven melden.",
    author: "Sven",
    date: "2026-04-06",
  },
];

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GUTEN MORGEN";
  if (hour < 17) return "GUTEN NACHMITTAG";
  return "GUTEN ABEND";
}

export default function HomeScreen() {
  const router = useRouter();
  const userName = "Alain";
  const hasKaffeeAbo = true;
  const currentKaffee = "Ethiopia Yirgacheffe";
  const [pinnwand, setPinnwand] = useState(initialPinnwand);
  const [newNote, setNewNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setPinnwand((prev) => [
      {
        id: String(Date.now()),
        text: newNote,
        author: userName,
        date: new Date().toISOString().split("T")[0]!,
      },
      ...prev,
    ]);
    setNewNote("");
    setShowNoteForm(false);
  }

  function dismissNote(id: string) {
    setPinnwand((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <header className="mb-5 pt-2 pr-12">
        <p className="text-sm text-gray-500">Via 1</p>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {getGreeting()}, {userName.toUpperCase()}
        </h1>
      </header>

      {/* Nächster Termin — reduziert */}
      <div
        className="mb-3 flex cursor-pointer items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3 transition-colors hover:bg-accent/10"
        onClick={() => router.push("/termine/1")}
      >
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            NÄCHSTER TERMIN
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            Haussitzung April
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400">Mi 16. Apr</p>
          <p className="font-mono text-xs text-gray-500">19:30</p>
        </div>
      </div>

      {/* Nächster Spinnerei-Anlass */}
      <a
        href={nextSpinnereiEvent.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center justify-between rounded-lg border border-secondary/30 bg-secondary/5 p-3 transition-colors hover:bg-secondary/10"
      >
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
            SPINNEREI
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {nextSpinnereiEvent.title}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400">
            {formatDateShort(nextSpinnereiEvent.date)}
          </p>
          <p className="font-mono text-xs text-gray-500">
            {formatTime(nextSpinnereiEvent.date)}
          </p>
        </div>
      </a>

      {/* Quick Widgets — Neon */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="cursor-pointer rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            SAUNA
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-emerald-300">62°C</p>
          <p className="mt-1 text-xs text-gray-500">Wird geheizt</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 transition-all hover:border-orange-500/40 hover:bg-orange-500/10"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-orange-400">
            AUFGABEN
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-orange-300">3</p>
          <p className="mt-1 text-xs text-gray-500">offen</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-400">
            PUTZDIENST
          </p>
          <p className="mt-1 text-lg font-bold text-violet-300">Dreiecksbar</p>
          <p className="mt-1 text-xs text-gray-500">ist dran</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/10"
          onClick={() => router.push("/gaesti")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            GÄSTI
          </p>
          <p className="mt-1 text-lg font-bold text-cyan-300">Frei</p>
          <p className="mt-1 text-xs text-gray-500">Nächste: 21. Apr</p>
        </div>
      </div>

      {/* Kaffee-Widget (nur für Abo-Inhaber) */}
      {hasKaffeeAbo && (
        <div
          className="mb-4 cursor-pointer rounded-lg border border-amber-600/20 bg-amber-600/5 p-3 transition-all hover:border-amber-600/40"
          onClick={() => router.push("/kaffee")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
            KAFFEE
          </p>
          <p className="mt-0.5 text-sm font-semibold text-amber-200">
            {currentKaffee}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">aktuell in der Mühle</p>
        </div>
      )}

      {/* Pinnwand */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            PINNWAND
          </p>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="font-display text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-accent"
          >
            + NEU
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={addNote} className="mb-3 flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nachricht an alle..."
              className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="rounded bg-accent px-3 py-2 font-display text-[10px] font-bold text-dark"
            >
              OK
            </button>
          </form>
        )}

        <div className="flex gap-3 overflow-x-auto pb-1">
          {pinnwand.map((p) => (
            <div
              key={p.id}
              className="relative w-56 shrink-0 rounded-lg border border-gray-700 bg-gray-900/60 p-3 pr-7"
            >
              <button
                onClick={() => dismissNote(p.id)}
                className="absolute right-1.5 top-1.5 text-gray-600 hover:text-gray-300"
                aria-label="Schliessen"
              >
                ×
              </button>
              <p className="text-sm text-gray-300">{p.text}</p>
              <p className="mt-2 text-xs text-gray-600">
                {p.author} ·{" "}
                {new Date(p.date).toLocaleDateString("de-CH", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
