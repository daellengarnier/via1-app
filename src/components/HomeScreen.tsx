"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";

interface PinnwandEintrag {
  id: string;
  text: string;
  author: string;
  date: string;
}

interface WeatherData {
  temp: number;
  code: number;
  summary: string;
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

// WMO Weather Codes zu Text + Emoji
function weatherSummary(code: number, willRainTonight: boolean): string {
  let day = "";
  if (code === 0) day = "☀️ Sonnig";
  else if (code <= 2) day = "🌤️ Überwiegend sonnig";
  else if (code === 3) day = "☁️ Bewölkt";
  else if (code <= 48) day = "🌫️ Neblig";
  else if (code <= 57) day = "🌦️ Nieselregen";
  else if (code <= 67) day = "🌧️ Regen";
  else if (code <= 77) day = "❄️ Schnee";
  else if (code <= 82) day = "🌧️ Regenschauer";
  else if (code <= 86) day = "🌨️ Schneeschauer";
  else if (code >= 95) day = "⛈️ Gewitter";
  else day = "Wetter";

  if (willRainTonight) day += " · 🌙 Regen in der Nacht";
  return day;
}

export default function HomeScreen() {
  const router = useRouter();
  const userName = "Alain";
  const hasKaffeeAbo = true;
  const currentKaffee = "Ethiopia Yirgacheffe";
  const [pinnwand, setPinnwand] = useState(initialPinnwand);
  const [newNote, setNewNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Wetter laden (Open-Meteo, kein API Key)
  useEffect(() => {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=46.9480&longitude=7.4474&current=temperature_2m,weather_code&hourly=precipitation&forecast_days=1&timezone=Europe%2FZurich";
    fetch(url)
      .then((r) => r.json())
      .then((data: {
        current?: { temperature_2m: number; weather_code: number };
        hourly?: { time: string[]; precipitation: number[] };
      }) => {
        if (!data.current) return;
        const now = new Date();
        const currentHour = now.getHours();
        // Nacht = 20:00 bis 06:00 Uhr
        let willRainTonight = false;
        if (data.hourly) {
          data.hourly.time.forEach((t, i) => {
            const d = new Date(t);
            const h = d.getHours();
            if ((h >= 20 || h < 6) && h >= currentHour && data.hourly!.precipitation[i]! > 0.2) {
              willRainTonight = true;
            }
          });
        }
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          summary: weatherSummary(data.current.weather_code, willRainTonight),
        });
      })
      .catch(() => {});
  }, []);

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
      <div className="h-56" />

      {/* Titel (unter Icon) */}
      <h1 className="mb-1 text-center font-cinzel text-3xl text-emerald-300">
        {getGreeting()}, {userName}
      </h1>

      {/* Wetter */}
      {weather && (
        <p className="mb-6 text-center text-sm text-gray-400">
          {weather.summary} · {weather.temp}°C
        </p>
      )}
      {!weather && <div className="mb-6 h-5" />}

      {/* Nächster Termin + Spinnerei — rund & nebeneinander */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="cursor-pointer rounded-full border border-accent/30 bg-accent/5 px-4 py-3 text-center transition-colors hover:bg-accent/10"
          onClick={() => router.push("/termine/1")}
        >
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-accent">
            TERMIN
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-white">
            Haussitzung
          </p>
          <p className="font-mono text-[10px] text-gray-500">
            Mi 16. Apr · 19:30
          </p>
        </div>
        <a
          href="https://kulturspinnerei.ch"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer rounded-full border border-secondary/30 bg-secondary/5 px-4 py-3 text-center transition-colors hover:bg-secondary/10"
        >
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-secondary">
            SPINNEREI
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-white">
            Soirée Tropicale
          </p>
          <p className="font-mono text-[10px] text-gray-500">
            Fr 25. Apr · 21:00
          </p>
        </a>
      </div>

      {/* Glasige Neon-Kacheln — ohne Gästi */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div
          className="cursor-pointer rounded-xl border border-red-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(255,50,50,0.1)]"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-red-400">
            SAUNA
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">62°C</p>
          <p className="mt-1 text-[10px] text-gray-500">geheizt</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-yellow-400/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(255,220,50,0.1)]"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-yellow-300">
            AUFGABEN
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">3</p>
          <p className="mt-1 text-[10px] text-gray-500">offen</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-violet-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(150,100,255,0.1)]"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-400">
            PUTZEN
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Dreiecks-<br/>bar</p>
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
