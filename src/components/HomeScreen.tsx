"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Termin {
  id: string;
  title: string;
  date: string;
  location: string;
  type: "sitzung" | "essen" | "sonstige";
}

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

const nextTermin: Termin = {
  id: "1",
  title: "Haussitzung April",
  date: "2026-04-16T19:30",
  location: "Gemeinschaftsraum EG",
  type: "sitzung",
};

const nextSpinnereiEvent: SpinnereiEvent = {
  title: "Soirée Tropicale",
  date: "2026-04-25T21:00",
  url: "https://kulturspinnerei.ch",
};

const typeLabels = {
  sitzung: "Sitzung",
  essen: "Essen",
  sonstige: "Sonstige",
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 17) return "Guten Nachmittag";
  return "Guten Abend";
}

export default function HomeScreen() {
  const router = useRouter();
  const userName = "Alain";
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
      <header className="mb-6 pt-2 pr-12">
        <h1 className="text-5xl font-bold tracking-tight text-accent">
          Via 1
        </h1>
        <p className="mt-1 text-lg text-gray-300">
          {getGreeting()}, {userName}
        </p>
      </header>

      {/* Nächster Termin */}
      <div
        className="mb-3 cursor-pointer rounded-lg border border-accent/30 bg-accent/5 p-4 transition-colors hover:bg-accent/10"
        onClick={() => router.push(`/termine/${nextTermin.id}`)}
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          NÄCHSTER TERMIN
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          {nextTermin.title}
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(nextTermin.date)} · {formatTime(nextTermin.date)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-xs text-accent">
            {typeLabels[nextTermin.type]}
          </span>
          <span className="text-xs text-gray-500">{nextTermin.location}</span>
        </div>
      </div>

      {/* Nächster Spinnerei-Anlass */}
      <a
        href={nextSpinnereiEvent.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 block rounded-lg border border-secondary/30 bg-secondary/5 p-4 transition-colors hover:bg-secondary/10"
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
          NÄCHSTER SPINNEREI-ANLASS
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          {nextSpinnereiEvent.title}
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(nextSpinnereiEvent.date)} ·{" "}
          {formatTime(nextSpinnereiEvent.date)}
        </p>
      </a>

      {/* Quick Widgets */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            SAUNA
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-accent">62°C</p>
          <p className="mt-1 text-xs text-gray-500">Wird geheizt</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            AUFGABEN
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-secondary">3</p>
          <p className="mt-1 text-xs text-gray-500">offen</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            PUTZDIENST
          </p>
          <p className="mt-1 text-lg font-bold text-accent">Dreiecksbar</p>
          <p className="mt-1 text-xs text-gray-500">ist dran</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/gaesti")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            GÄSTI
          </p>
          <p className="mt-1 text-lg font-bold text-accent">Frei</p>
          <p className="mt-1 text-xs text-gray-500">Nächste: 21. Apr</p>
        </div>
      </div>

      {/* Pinnwand */}
      <div className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
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
