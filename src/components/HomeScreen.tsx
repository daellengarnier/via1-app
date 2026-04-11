"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";

interface PinnwandEintrag {
  id: string;
  text: string;
  author: string;
  date: string;
}

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 17) return "Guten Nachmittag";
  return "Guten Abend";
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
    <div className="relative p-4 pb-20">
      <AnimatedBackground icon="/pyramid.webp" />
      {/* Platz für die Pyramide */}
      <div className="h-24" />

      {/* Header */}
      <header className="mb-5 pr-12">
        <p className="text-xs tracking-widest text-gray-500">Via 1</p>
        <h1 className="font-heading text-3xl text-white">
          {getGreeting()}, {userName}
        </h1>
      </header>

      {/* Nächster Termin — einzeilig */}
      <div
        className="mb-3 cursor-pointer rounded-lg border border-accent/20 bg-gradient-to-r from-accent/8 to-transparent p-3 transition-colors hover:bg-accent/10"
        onClick={() => router.push("/termine/1")}
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          NÄCHSTER TERMIN
        </p>
        <p className="mt-0.5 text-sm text-white">
          Haussitzung April{" "}
          <span className="text-gray-500">· Mi 16. Apr · 19:30</span>
        </p>
      </div>

      {/* Spinnerei — einzeilig */}
      <a
        href="https://kulturspinnerei.ch"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 block rounded-lg border border-secondary/20 bg-gradient-to-r from-secondary/8 to-transparent p-3 transition-colors hover:bg-secondary/10"
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
          SPINNEREI
        </p>
        <p className="mt-0.5 text-sm text-white">
          Soirée Tropicale{" "}
          <span className="text-gray-500">· Fr 25. Apr · 21:00</span>
        </p>
      </a>

      {/* Glasige Neon-Kacheln */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="cursor-pointer rounded-xl border border-emerald-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(0,255,100,0.1)]"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            SAUNA
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">62°C</p>
          <p className="mt-1 text-xs text-gray-500">Wird geheizt</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-orange-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(255,150,50,0.1)]"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-orange-400">
            AUFGABEN
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">3</p>
          <p className="mt-1 text-xs text-gray-500">offen</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-violet-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(150,100,255,0.1)]"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-400">
            PUTZDIENST
          </p>
          <p className="mt-1 text-lg font-semibold text-white">Dreiecksbar</p>
          <p className="mt-1 text-xs text-gray-500">ist dran</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-cyan-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(50,200,255,0.1)]"
          onClick={() => router.push("/gaesti")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            GÄSTI
          </p>
          <p className="mt-1 text-lg font-semibold text-white">Frei</p>
          <p className="mt-1 text-xs text-gray-500">Nächste: 21. Apr</p>
        </div>
      </div>

      {/* Kaffee (nur für Abo) */}
      {hasKaffeeAbo && (
        <div
          className="mb-4 cursor-pointer rounded-lg border border-white/5 bg-gradient-to-r from-amber-600/10 to-transparent p-3 transition-all hover:from-amber-600/15"
          onClick={() => router.push("/kaffee")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
            KAFFEE
          </p>
          <p className="mt-0.5 text-sm text-amber-200">
            {currentKaffee}{" "}
            <span className="text-gray-500">· in der Mühle</span>
          </p>
        </div>
      )}

      {/* Pinnwand */}
      <div className="rounded-lg border border-white/5 bg-gradient-to-b from-white/3 to-transparent p-4">
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
              className="flex-1 rounded border border-gray-700 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
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
              className="relative w-52 shrink-0 rounded-lg border border-white/5 bg-white/3 p-3 pr-7"
            >
              <button
                onClick={() => dismissNote(p.id)}
                className="absolute right-1.5 top-1.5 text-gray-600 hover:text-gray-300"
                aria-label="Schliessen"
              >
                ×
              </button>
              <p className="text-xs leading-relaxed text-gray-300">{p.text}</p>
              <p className="mt-2 text-[10px] text-gray-600">
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
