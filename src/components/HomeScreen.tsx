"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TabHeader } from "./TabHeader";
import { useCurrentKaffee } from "@/lib/kaffee-store";
import { usePutzplan } from "@/lib/putzplan-store";

interface PinnwandEintrag {
  id: string;
  text: string;
  author: string;
  authorId: string;
  date: string;
}

interface NextTermin {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
}

interface WeatherData {
  temp: number;
  code: number;
  summary: string;
}

interface AareData {
  temp: number;
  flow: number;
}

// Pinnwand wird aus /api/pinnwand gelesen

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
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "";
  const userId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const hasKaffeeAbo = true;
  const [currentKaffee] = useCurrentKaffee();
  const [, , putzCurrentWg] = usePutzplan();
  const [openAufgabenCount, setOpenAufgabenCount] = useState<number | null>(
    null
  );
  const [nextTermin, setNextTermin] = useState<NextTermin | null>(null);
  const [pinnwand, setPinnwand] = useState<PinnwandEintrag[]>([]);
  const [pinnwandError, setPinnwandError] = useState<string | null>(null);
  const [pinnwandLoading, setPinnwandLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aare, setAare] = useState<AareData | null>(null);

  // Pinnwand laden
  const loadPinnwand = useCallback(async () => {
    try {
      const res = await fetch("/api/pinnwand");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as PinnwandEintrag[];
      setPinnwand(data);
      setPinnwandError(null);
    } catch (err) {
      console.error("Pinnwand laden fehlgeschlagen", err);
      setPinnwandError("Pinnwand konnte nicht geladen werden");
    } finally {
      setPinnwandLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPinnwand();
  }, [loadPinnwand]);

  // Aufgaben-Count fuer die Tile
  useEffect(() => {
    fetch("/api/aufgaben")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { done: boolean }[]) => {
        setOpenAufgabenCount(data.filter((a) => !a.done).length);
      })
      .catch(() => {});
  }, []);

  // Naechster Termin fuer die Tile
  useEffect(() => {
    fetch("/api/termine")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NextTermin[]) => {
        const todayStr = new Date().toISOString().split("T")[0]!;
        const upcoming = data
          .filter((t) => t.date >= todayStr)
          .sort((a, b) =>
            a.date === b.date
              ? a.time.localeCompare(b.time)
              : a.date.localeCompare(b.date)
          );
        setNextTermin(upcoming[0] ?? null);
      })
      .catch(() => {});
  }, []);

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

  // Aare-Daten laden (aare.guru API, kein API Key)
  useEffect(() => {
    const url =
      "https://aareguru.existenz.ch/v2018/current?city=bern&app=via1-app&version=1.0";
    fetch(url)
      .then((r) => r.json())
      .then((data: { aare?: { temperature?: number; flow?: number } }) => {
        if (!data.aare) return;
        if (
          typeof data.aare.temperature === "number" &&
          typeof data.aare.flow === "number"
        ) {
          setAare({
            temp: Math.round(data.aare.temperature * 10) / 10,
            flow: Math.round(data.aare.flow),
          });
        }
      })
      .catch(() => {});
  }, []);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const text = newNote.trim();
    if (!text) return;
    try {
      const res = await fetch("/api/pinnwand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as PinnwandEintrag;
      setPinnwand((prev) => [created, ...prev]);
      setNewNote("");
      setShowNoteForm(false);
    } catch (err) {
      console.error("Pinnwand-Eintrag erstellen fehlgeschlagen", err);
      alert("Konnte Eintrag nicht speichern. Bitte erneut versuchen.");
    }
  }

  async function dismissNote(id: string) {
    // Optimistic update
    const previous = pinnwand;
    setPinnwand((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/pinnwand/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Loeschen fehlgeschlagen", err);
      setPinnwand(previous);
      alert("Konnte nicht loeschen.");
    }
  }

  function startEditNote(id: string, text: string) {
    setEditingNoteId(id);
    setEditNoteText(text);
  }

  async function saveEditNote() {
    const text = editNoteText.trim();
    if (!editingNoteId || !text) return;
    const id = editingNoteId;
    try {
      const res = await fetch(`/api/pinnwand/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as PinnwandEintrag;
      setPinnwand((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingNoteId(null);
      setEditNoteText("");
    } catch (err) {
      console.error("Bearbeiten fehlgeschlagen", err);
      alert("Konnte Aenderung nicht speichern.");
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <TabHeader
        title={`${getGreeting()}, ${userName}`}
        icon="/pyramid.webp"
        color="green"
      />

      {/* Wetter + Aare */}
      {(weather || aare) && (
        <div className="-mt-4 mb-6 space-y-0.5 text-center">
          {weather && (
            <p className="text-sm text-gray-400">
              {weather.summary} · {weather.temp}°C
            </p>
          )}
          {aare && (
            <p className="font-mono text-xs text-cyan-300/80">
              🌊 Aare {aare.temp}°C · {aare.flow} m³/s
            </p>
          )}
        </div>
      )}
      {!weather && !aare && <div className="-mt-4 mb-6 h-5" />}

      {/* Nächster Termin + Spinnerei — rund & nebeneinander */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="cursor-pointer rounded-full border border-accent/30 bg-accent/5 px-4 py-3 text-center transition-colors hover:bg-accent/10"
          onClick={() =>
            router.push(nextTermin ? `/termine/${nextTermin.id}` : "/termine")
          }
        >
          <p className="font-display text-[9px] font-bold uppercase tracking-widest text-accent">
            TERMIN
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-white">
            {nextTermin?.title ?? "Keine"}
          </p>
          <p className="font-mono text-[10px] text-gray-500">
            {nextTermin
              ? `${new Date(nextTermin.date).toLocaleDateString("de-CH", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })} · ${nextTermin.time}`
              : "—"}
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
          <p className="mt-1 font-mono text-2xl font-bold text-white">
            {openAufgabenCount ?? "–"}
          </p>
          <p className="mt-1 text-[10px] text-gray-500">offen</p>
        </div>
        <div
          className="cursor-pointer rounded-xl border border-violet-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(150,100,255,0.1)]"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-400">
            PUTZEN
          </p>
          <p className="mt-1 break-words text-sm font-semibold leading-tight text-white">
            {putzCurrentWg ?? "—"}
          </p>
        </div>
      </div>

      {/* Kaffee (nur für Abo) — kompakte runde Pille */}
      {hasKaffeeAbo && (
        <div
          className="mb-5 cursor-pointer rounded-full border border-amber-600/30 bg-gradient-to-r from-amber-700/10 to-transparent px-4 py-2.5 transition-all hover:border-amber-500/50"
          onClick={() => router.push("/kaffee")}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">☕</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-amber-200">
                {currentKaffee.name}
                {currentKaffee.fairtrade && (
                  <span className="ml-1 text-[9px] text-emerald-400">
                    ● Fair Trade
                  </span>
                )}
              </p>
              <p className="truncate text-[10px] text-gray-500">
                {currentKaffee.duftnotizen} · {currentKaffee.herkunft}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pinnwand als Sticky Notes */}
      <div className="relative">
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
          <form onSubmit={addNote} className="mb-4 flex gap-2">
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

        {/* Glassy Sticky Notes Grid */}
        <div className="grid grid-cols-2 gap-3">
          {pinnwand.map((p, i) => {
            const styles = [
              {
                grad: "from-yellow-400/30 to-yellow-600/10",
                border: "border-yellow-400/30",
                text: "text-yellow-100",
                meta: "text-yellow-300/70",
                rot: "-rotate-1",
              },
              {
                grad: "from-pink-400/30 to-pink-600/10",
                border: "border-pink-400/30",
                text: "text-pink-100",
                meta: "text-pink-300/70",
                rot: "rotate-1",
              },
              {
                grad: "from-cyan-400/30 to-cyan-600/10",
                border: "border-cyan-400/30",
                text: "text-cyan-100",
                meta: "text-cyan-300/70",
                rot: "-rotate-2",
              },
              {
                grad: "from-lime-400/30 to-lime-600/10",
                border: "border-lime-400/30",
                text: "text-lime-100",
                meta: "text-lime-300/70",
                rot: "rotate-2",
              },
              {
                grad: "from-orange-400/30 to-orange-600/10",
                border: "border-orange-400/30",
                text: "text-orange-100",
                meta: "text-orange-300/70",
                rot: "-rotate-1",
              },
            ];
            const style = styles[i % styles.length]!;
            const isOwn = p.authorId === userId;
            const canDelete = isOwn || isAdmin;
            const isEditing = editingNoteId === p.id;
            return (
              <div
                key={p.id}
                className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.grad} ${style.rot} p-3 pb-7 shadow-lg backdrop-blur-md transition-transform hover:rotate-0 hover:scale-105`}
                style={{
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {/* Glassy highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />

                {/* Edit-Button oben links (nur fuer eigene Eintraege) */}
                {isOwn && !isEditing && (
                  <button
                    onClick={() => startEditNote(p.id, p.text)}
                    className={`absolute left-1 top-0.5 text-[11px] ${style.meta} opacity-80 hover:opacity-100`}
                    aria-label="Bearbeiten"
                  >
                    ✎
                  </button>
                )}

                {/* Loeschen-Button oben rechts */}
                {canDelete && !isEditing && (
                  <button
                    onClick={() => dismissNote(p.id)}
                    className={`absolute right-1 top-0.5 ${style.meta} opacity-80 hover:opacity-100`}
                    aria-label="Schliessen"
                  >
                    ×
                  </button>
                )}

                {isEditing ? (
                  <div className="relative pt-1">
                    <textarea
                      value={editNoteText}
                      onChange={(e) => setEditNoteText(e.target.value)}
                      rows={3}
                      autoFocus
                      className={`w-full resize-none rounded bg-black/30 p-1.5 text-xs leading-relaxed ${style.text} focus:outline-none`}
                    />
                    <div className="mt-1 flex gap-1">
                      <button
                        onClick={saveEditNote}
                        className={`rounded bg-black/40 px-2 py-0.5 text-[9px] font-bold ${style.text}`}
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditNoteText("");
                        }}
                        className={`rounded px-2 py-0.5 text-[9px] ${style.meta}`}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={`relative pt-1 text-xs leading-relaxed ${style.text}`}
                  >
                    {p.text}
                  </p>
                )}
                {!isEditing && (
                  <div
                    className={`absolute bottom-1.5 left-3 right-3 flex items-end justify-between font-mono text-[9px] ${style.meta}`}
                  >
                    <span>
                      {new Date(p.date).toLocaleDateString("de-CH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span>— {p.author}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pinnwandLoading && pinnwand.length === 0 && (
          <p className="text-center text-xs text-gray-600">Laden …</p>
        )}
        {!pinnwandLoading && !pinnwandError && pinnwand.length === 0 && (
          <p className="text-center text-sm text-gray-600">
            Keine Nachrichten
          </p>
        )}
        {pinnwandError && (
          <p className="text-center text-xs text-red-400">{pinnwandError}</p>
        )}
      </div>
    </div>
  );
}
