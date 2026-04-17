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
  commentCount: number;
}

interface PinnwandComment {
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

interface NextActivity {
  id: string;
  title: string;
  startAt: string; // ISO
  location: string;
  createdBy: string;
  participantsGoing: number;
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
function codeToText(code: number): string {
  if (code === 0) return "☀️ Sonnig";
  if (code <= 2) return "🌤️ Überwiegend sonnig";
  if (code === 3) return "☁️ Bewölkt";
  if (code <= 48) return "🌫️ Neblig";
  if (code <= 57) return "🌦️ Nieselregen";
  if (code <= 67) return "🌧️ Regen";
  if (code <= 77) return "❄️ Schnee";
  if (code <= 82) return "🌧️ Regenschauer";
  if (code <= 86) return "🌨️ Schneeschauer";
  if (code >= 95) return "⛈️ Gewitter";
  return "Wetter";
}

function weatherSummary(
  code: number,
  willRainTonight: boolean,
  willRainDaytime: boolean
): string {
  const hour = new Date().getHours();
  let text = codeToText(code);
  // Morgens (bis 12): Tagesprognose
  if (hour < 12 && willRainDaytime) {
    text += " · 🌧️ Regen tagsüber";
  }
  // Abends (ab 18): Nachtprognose
  if (hour >= 18 && willRainTonight) {
    text += " · 🌙 Regen in der Nacht";
  }
  // Nachmittag: beides moeglich
  if (hour >= 12 && hour < 18) {
    if (willRainTonight) text += " · 🌙 Regen heute Nacht";
  }
  return text;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [hasKaffeeAbo, setHasKaffeeAbo] = useState(false);
  const [profileMissing, setProfileMissing] = useState<string[]>([]);
  const [userName, setUserName] = useState(session?.user?.name ?? "");
  const [kaffeeState] = useCurrentKaffee();
  const currentKaffee = kaffeeState.kaffee;
  const [, , putzCurrentWg] = usePutzplan();
  const [saunaTemp, setSaunaTemp] = useState<number | null>(null);
  const [openAufgabenCount, setOpenAufgabenCount] = useState<number | null>(
    null
  );
  const [nextTermin, setNextTermin] = useState<NextTermin | null>(null);
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null);
  const [pinnwand, setPinnwand] = useState<PinnwandEintrag[]>([]);
  const [pinnwandCommentsOpen, setPinnwandCommentsOpen] = useState<
    string | null
  >(null);
  const [pinnwandComments, setPinnwandComments] = useState<PinnwandComment[]>(
    []
  );
  const [pinnwandCommentsLoading, setPinnwandCommentsLoading] = useState(false);
  const [newPinnwandComment, setNewPinnwandComment] = useState("");
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

  // Sauna-Temperatur berechnen: localStorage speichert Aufheiz-Startzeit.
  // 30min bis 80°C, danach konstant. Reset nach Mitternacht.
  useEffect(() => {
    function calcTemp(): number {
      const outsideTemp = weather?.temp ?? 15;
      const stored = localStorage.getItem("via1-sauna-start");
      if (!stored) return outsideTemp;
      const startTime = parseInt(stored, 10);
      if (Number.isNaN(startTime)) return outsideTemp;
      // Nacht-Reset: wenn Start vor Mitternacht und jetzt nach 6 Uhr
      const startDate = new Date(startTime);
      const now = new Date();
      if (
        startDate.getDate() !== now.getDate() &&
        now.getHours() >= 6
      ) {
        localStorage.removeItem("via1-sauna-start");
        return outsideTemp;
      }
      const elapsed = (Date.now() - startTime) / 60000; // Minuten
      if (elapsed < 0) return outsideTemp;
      const target = 80;
      const progress = Math.min(1, elapsed / 30);
      return Math.round(outsideTemp + (target - outsideTemp) * progress);
    }
    setSaunaTemp(calcTemp());
    const id = setInterval(() => setSaunaTemp(calcTemp()), 30000);
    return () => clearInterval(id);
  }, [weather]);

  // Aufgaben-Count fuer die Tile
  useEffect(() => {
    fetch("/api/aufgaben")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { done: boolean }[]) => {
        setOpenAufgabenCount(data.filter((a) => !a.done).length);
      })
      .catch(() => {});
  }, []);

  // Aktuellen Anzeigenamen aus dem Profil holen (der in der Session
  // ist nur der beim Login gecachte Name)
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data:
            | {
                displayName?: string;
                hasKaffeeAbo?: boolean;
                fullName?: string;
                birthday?: string;
                favoriteAnimal?: string;
                profileImage?: string | null;
                room?: string;
              }
            | null
        ) => {
          if (data?.displayName) setUserName(data.displayName);
          if (data && typeof data.hasKaffeeAbo === "boolean") {
            setHasKaffeeAbo(data.hasKaffeeAbo);
          }
          if (data) {
            const missing: string[] = [];
            if (!data.fullName) missing.push("Vollständiger Name");
            if (!data.birthday) missing.push("Geburtstag");
            if (!data.favoriteAnimal) missing.push("Lieblingstier");
            if (!data.room) missing.push("Zimmer");
            setProfileMissing(missing);
          }
        }
      )
      .catch(() => {});
  }, []);

  // Naechster Termin fuer die Tile
  useEffect(() => {
    fetch("/api/termine")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NextTermin[]) => {
        // Vergleich auf Minuten-Basis: ein Termin ist "durch", sobald
        // sein Startzeitpunkt in der Vergangenheit liegt
        const now = Date.now();
        const upcoming = data
          .filter((t) => {
            const ts = new Date(`${t.date}T${t.time}:00`).getTime();
            return !Number.isNaN(ts) && ts >= now;
          })
          .sort((a, b) =>
            a.date === b.date
              ? a.time.localeCompare(b.time)
              : a.date.localeCompare(b.date)
          );
        setNextTermin(upcoming[0] ?? null);
      })
      .catch(() => {});
  }, []);

  // Naechste Aktivitaet fuer die Tile
  useEffect(() => {
    interface ApiActivity {
      id: string;
      title: string;
      startAt: string;
      location: string;
      createdBy: string;
      participants: { going: boolean }[];
    }
    fetch("/api/activities")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ApiActivity[]) => {
        const sorted = [...data].sort((a, b) =>
          a.startAt.localeCompare(b.startAt)
        );
        const first = sorted[0];
        if (!first) {
          setNextActivity(null);
          return;
        }
        setNextActivity({
          id: first.id,
          title: first.title,
          startAt: first.startAt,
          location: first.location,
          createdBy: first.createdBy,
          participantsGoing: first.participants.filter((p) => p.going).length,
        });
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
        let willRainTonight = false;
        let willRainDaytime = false;
        if (data.hourly) {
          data.hourly.time.forEach((t, i) => {
            const d = new Date(t);
            const h = d.getHours();
            const precip = data.hourly!.precipitation[i] ?? 0;
            if (precip < 0.2) return;
            // Nacht: 20-06 Uhr
            if ((h >= 20 || h < 6) && h >= currentHour) {
              willRainTonight = true;
            }
            // Tag: 06-20 Uhr
            if (h >= 6 && h < 20 && h >= currentHour) {
              willRainDaytime = true;
            }
          });
        }
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          summary: weatherSummary(
            data.current.weather_code,
            willRainTonight,
            willRainDaytime
          ),
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

  async function openPinnwandComments(id: string) {
    setPinnwandCommentsOpen(id);
    setPinnwandCommentsLoading(true);
    setPinnwandComments([]);
    try {
      const res = await fetch(`/api/pinnwand/${id}/comments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as PinnwandComment[];
      setPinnwandComments(data);
    } catch (err) {
      console.error("comments laden", err);
    } finally {
      setPinnwandCommentsLoading(false);
    }
  }

  async function addPinnwandComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newPinnwandComment.trim();
    if (!text || !pinnwandCommentsOpen) return;
    try {
      const res = await fetch(
        `/api/pinnwand/${pinnwandCommentsOpen}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as PinnwandComment;
      setPinnwandComments((prev) => [...prev, created]);
      setNewPinnwandComment("");
      // commentCount lokal in pinnwand erhoehen
      setPinnwand((prev) =>
        prev.map((p) =>
          p.id === pinnwandCommentsOpen
            ? { ...p, commentCount: (p.commentCount ?? 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error("Kommentar speichern", err);
      alert("Konnte Kommentar nicht speichern.");
    }
  }

  async function deletePinnwandComment(cid: string) {
    try {
      const res = await fetch(`/api/pinnwand/comments/${cid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPinnwandComments((prev) => prev.filter((c) => c.id !== cid));
      setPinnwand((prev) =>
        prev.map((p) =>
          p.id === pinnwandCommentsOpen
            ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 1) - 1) }
            : p
        )
      );
    } catch (err) {
      console.error("Kommentar loeschen", err);
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <TabHeader
        title={`${getGreeting()}, ${userName}`}
        icon="/pyramid.webp"
        color="green"
        scrollable
      />

      {/* Wetter + Aare */}
      {(weather || aare) && (
        <div className="-mt-4 mb-6 space-y-0.5 text-center">
          {weather && (
            <p className="text-sm text-gray-400">
              {weather.summary} · {weather.temp}°C
              <span className="ml-1 text-[9px] text-gray-600">
                ({new Date().getHours() < 12 ? "Prognose heute" : "aktuell + Nacht"})
              </span>
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
        {nextActivity ? (
          <div
            className="cursor-pointer rounded-full border border-blue-400/30 bg-blue-400/5 px-4 py-3 text-center transition-colors hover:bg-blue-400/10"
            onClick={() => router.push("/aktivitaeten")}
          >
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-blue-300">
              AKTIVITÄT
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-white">
              {nextActivity.title}
            </p>
            <p className="font-mono text-[10px] text-gray-500">
              {new Date(nextActivity.startAt).toLocaleDateString("de-CH", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              ·{" "}
              {new Date(nextActivity.startAt).toLocaleTimeString("de-CH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : !hasKaffeeAbo ? (
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
        ) : (
          <div className="rounded-full border border-gray-800 bg-white/5 px-4 py-3 text-center">
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-gray-500">
              AKTIVITÄT
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
              Keine geplant
            </p>
            <p className="font-mono text-[10px] text-gray-700">—</p>
          </div>
        )}
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
          <p className="mt-1 font-mono text-2xl font-bold text-white">
            {saunaTemp ?? "–"}°C
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {(saunaTemp ?? 0) >= 60 ? "geheizt 🔥" : "kalt"}
          </p>
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

      {/* Animierte Wellenlinie als Trenner */}
      <div className="mb-4 flex justify-center overflow-hidden">
        <svg
          viewBox="0 0 400 20"
          className="h-4 w-full max-w-lg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10"
            fill="none"
            stroke="url(#wave-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10;M0 10 Q25 20 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10;M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <defs>
            <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="rgba(184,240,104,0.3)" />
              <stop offset="50%" stopColor="rgba(184,240,104,0.5)" />
              <stop offset="80%" stopColor="rgba(184,240,104,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Kaffee (nur für Abo) + Spinnerei — 2-Spalten */}
      {hasKaffeeAbo ? (
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="cursor-pointer rounded-2xl border border-amber-600/30 bg-gradient-to-br from-amber-700/15 to-transparent p-3 transition-all hover:border-amber-500/50"
              onClick={() => router.push("/kaffee")}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-base">☕</span>
                <p className="font-display text-[9px] font-bold uppercase tracking-widest text-amber-300">
                  KAFFEEMÜHLE
                </p>
              </div>
              <p className="truncate text-sm font-semibold text-amber-200">
                {currentKaffee.name}
              </p>
              {currentKaffee.duftnotizen && (
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-400">
                  {currentKaffee.duftnotizen}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-[9px]">
                {currentKaffee.herkunft && (
                  <span className="text-gray-500">
                    {currentKaffee.herkunft}
                  </span>
                )}
                {currentKaffee.fairtrade && (
                  <span className="text-emerald-400">● Fair</span>
                )}
              </div>
            </div>
            <div
              className="group flex cursor-pointer flex-col rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/15 to-transparent p-3 transition-all hover:border-secondary/60"
              onClick={() =>
                window.open(
                  "https://kulturspinnerei.ch",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/spinnerei-logo.webp"
                  alt=""
                  className="h-4 w-4 animate-[spin_8s_linear_infinite]"
                  loading="eager"
                />
                <p className="font-display text-[9px] font-bold uppercase tracking-widest text-secondary">
                  SPINNEREI
                </p>
              </div>
              <p className="truncate text-sm font-semibold text-orange-200">
                Soirée Tropicale
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                Fr 25. Apr
              </p>
              <p className="font-mono text-[10px] text-gray-500">
                20:00 – 02:30
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    "https://spinnplan-23.netlify.app",
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="mt-2 rounded-full border border-secondary/50 bg-secondary/20 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-orange-200 transition-colors hover:bg-secondary/30"
              >
                📋 Schichtplan →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pinnwand als Sticky Notes */}
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex-1" />
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            PINNWAND
          </p>
          <div className="flex flex-1 justify-end">
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="font-display text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-accent"
            >
              + NEU
            </button>
          </div>
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
          {profileMissing.length > 0 && (
            <button
              onClick={() => router.push("/profil")}
              className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/30 to-amber-600/10 rotate-1 p-3 pb-7 text-left shadow-lg backdrop-blur-md transition-transform hover:rotate-0 hover:scale-105"
              style={{
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />
              <p className="relative pt-1 text-xs font-semibold leading-relaxed text-amber-100">
                👤 Dein Profil ist noch nicht vollständig
              </p>
              <p className="relative mt-1 text-[10px] leading-snug text-amber-100/80">
                Noch offen: {profileMissing.join(", ")}
              </p>
              <div className="absolute bottom-1.5 left-3 right-3 flex items-end justify-between font-mono text-[9px] text-amber-300/80">
                <span>jetzt</span>
                <span>— Via 1 ›</span>
              </div>
            </button>
          )}
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
                  <button
                    type="button"
                    onClick={() => openPinnwandComments(p.id)}
                    className={`relative block w-full cursor-pointer pt-1 text-left text-xs leading-relaxed ${style.text}`}
                    aria-label="Kommentare ansehen"
                  >
                    {p.text}
                  </button>
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
                    <div className="flex items-center gap-1.5">
                      {(p.commentCount ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => openPinnwandComments(p.id)}
                          className={`rounded px-1 ${style.meta} hover:bg-black/20`}
                        >
                          💬 {p.commentCount}
                        </button>
                      )}
                      <span>— {p.author}</span>
                    </div>
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

      {/* Pinnwand Kommentar-Modal */}
      {pinnwandCommentsOpen && (() => {
        const note = pinnwand.find((p) => p.id === pinnwandCommentsOpen);
        return (
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]"
            onClick={() => {
              setPinnwandCommentsOpen(null);
              setPinnwandComments([]);
              setNewPinnwandComment("");
            }}
          >
            <div
              className="my-4 w-full max-w-md rounded-2xl border border-gray-800 bg-dark pb-[env(safe-area-inset-bottom,0px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 border-b border-gray-800 bg-dark/95 px-5 py-3 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                    PINNWAND-EINTRAG
                  </p>
                  <button
                    onClick={() => {
                      setPinnwandCommentsOpen(null);
                      setPinnwandComments([]);
                      setNewPinnwandComment("");
                    }}
                    className="text-gray-500 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-5">
                {note && (
                  <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
                    <p className="text-sm leading-relaxed text-white">
                      {note.text}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-gray-500">
                      — {note.author} ·{" "}
                      {new Date(note.date).toLocaleDateString("de-CH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
                  KOMMENTARE{" "}
                  {pinnwandComments.length > 0 &&
                    `(${pinnwandComments.length})`}
                </p>

                {pinnwandCommentsLoading ? (
                  <p className="text-center text-xs text-gray-600">Laden…</p>
                ) : pinnwandComments.length === 0 ? (
                  <p className="text-center text-xs text-gray-600">
                    Noch keine Kommentare
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pinnwandComments.map((c) => {
                      const canDeleteComment =
                        c.authorId === userId || isAdmin;
                      return (
                        <div
                          key={c.id}
                          className="rounded border-l-2 border-accent/50 bg-white/5 px-2 py-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 text-xs text-gray-200">
                              {c.text}
                            </p>
                            {canDeleteComment && (
                              <button
                                onClick={() => deletePinnwandComment(c.id)}
                                className="text-[10px] text-gray-600 hover:text-red-400"
                                aria-label="Loeschen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[9px] text-gray-500">
                            — {c.author} ·{" "}
                            {new Date(c.date).toLocaleDateString("de-CH", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={addPinnwandComment} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newPinnwandComment}
                    onChange={(e) => setNewPinnwandComment(e.target.value)}
                    placeholder="Kommentar schreiben…"
                    className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded bg-accent px-3 py-2 font-display text-[10px] font-bold text-dark"
                  >
                    OK
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
