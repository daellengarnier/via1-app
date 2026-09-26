"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TabHeader } from "./TabHeader";
import { LaundryTimers } from "./LaundryTimers";
import { SaunaSparkline } from "./SaunaChart";
import { ReactionBar } from "./ReactionBar";
import {
  DroneOverlay,
  DroneHistoryButton,
  type DroneFlightInfo,
} from "./DroneOverlay";
import { useCurrentKaffee } from "@/lib/kaffee-store";
import { usePutzplan } from "@/lib/putzplan-store";
import { WgKochenTile } from "./WgKochenTile";
import { HomeLayoutGrid, type HomeBlockDef } from "./HomeLayoutGrid";
import {
  normalizeHomeLayout,
  type HomeBlockId,
  type HomeLayout,
} from "@/lib/home-layout";

interface ReactionSummary {
  emoji: string;
  count: number;
  mine: boolean;
}
interface PinnwandEintrag {
  id: string;
  text: string;
  author: string;
  authorId: string;
  date: string;
  commentCount: number;
  reactions?: ReactionSummary[];
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

// Prueft ob ein Datum (ISO oder "YYYY-MM-DD") "heute" in der lokalen
// Zeitzone ist. Wird fuer die Pulse-Animation auf den Home-Tiles genutzt.
function isToday(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Pinnwand wird aus /api/pinnwand gelesen

// Stale-while-revalidate helpers fuer Home-Tile-State.
function readLs<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLs<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 17) return "Guten Nachmittag";
  return "Guten Abend";
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
  const [putzRotation, , putzCurrentWg] = usePutzplan();
  const putzPrev = [...putzRotation]
    .filter((r) => r.completedAt !== null)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
  const putzPrevWg = putzPrev?.wg ?? null;
  const putzPrevDate = putzPrev?.completedAt ?? null;
  const putzDaysSince = putzPrevDate
    ? Math.floor(
        (Date.now() - new Date(putzPrevDate).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : null;
  const [saunaTemp, setSaunaTemp] = useState<number | null>(null);
  const [saunaLive, setSaunaLive] = useState(false);
  const [saunaAgeSec, setSaunaAgeSec] = useState<number | null>(null);
  const [saunaHeating, setSaunaHeating] = useState<
    { startedByName: string; minutesAgo: number } | null
  >(null);
  const [openAufgabenCount, setOpenAufgabenCount] = useState<number | null>(
    null
  );
  // Cached state: zeigt sofort die letzten gesehenen Daten beim Mount,
  // statt erst den Server-Roundtrip abzuwarten.
  const [upcomingTermine, setUpcomingTermine] = useState<NextTermin[]>(() =>
    readLs<NextTermin[]>("via1-home-upcomingTermine", [])
  );
  const [upcomingActivities, setUpcomingActivities] = useState<
    NextActivity[]
  >(() => readLs<NextActivity[]>("via1-home-upcomingActivities", []));
  const nextTermin = upcomingTermine[0] ?? null;
  const nextActivity = upcomingActivities[0] ?? null;
  // Individuelle Anordnung der Bloecke (Server = Quelle, localStorage
  // nur damit die Seite sofort in der gewohnten Reihenfolge steht).
  const [layout, setLayout] = useState<HomeLayout>(() =>
    normalizeHomeLayout(readLs<unknown>("via1-home-layout", null))
  );
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    fetch("/api/home/layout")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (!d) return;
        const l = normalizeHomeLayout(d);
        setLayout(l);
        writeLs("via1-home-layout", l);
      })
      .catch(() => {});
  }, []);
  function updateLayout(next: HomeLayout) {
    setLayout(next);
    writeLs("via1-home-layout", next);
    fetch("/api/home/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }
  async function resetLayout() {
    if (!confirm("Anordnung auf Standard zurücksetzen?")) return;
    try {
      const res = await fetch("/api/home/layout", { method: "DELETE" });
      const d: unknown = res.ok ? await res.json() : null;
      const l = normalizeHomeLayout(d);
      setLayout(l);
      writeLs("via1-home-layout", l);
    } catch {
      // ignore
    }
  }
  const [pinnwand, setPinnwand] = useState<PinnwandEintrag[]>(
    () => readLs<PinnwandEintrag[]>("via1-home-pinnwand", [])
  );
  // Drohne ist ein globaler Server-State: ein aktiver Flight ist fuer
  // alle User sichtbar. Wir pollen /api/drohne im aktiven Zustand alle
  // 4s (fuer Beschwerden), inaktiv alle 12s (nur zum Start-Erkennen).
  const [droneFlight, setDroneFlight] = useState<DroneFlightInfo | null>(null);

  const fetchDroneState = useCallback(async () => {
    try {
      const res = await fetch("/api/drohne", { cache: "no-store" });
      if (!res.ok) return;
      const data: { flight: DroneFlightInfo | null } = await res.json();
      setDroneFlight(data.flight);
    } catch {
      // ignore — Polling laeuft weiter
    }
  }, []);

  // Polling nur nach Aktiv-Status (nicht nach Objekt-Referenz), sonst
  // wird das Intervall bei jeder Antwort neu aufgesetzt. Im Hintergrund-
  // Tab wird nicht gepollt. Start/Stop laeuft ueber das Hamburger-Menu,
  // das nach einer Aktion "via1:drone-changed" feuert.
  const droneActive = droneFlight !== null;
  useEffect(() => {
    fetchDroneState();
    const intervalMs = droneActive ? 10_000 : 60_000;
    const id = window.setInterval(() => {
      if (!document.hidden) fetchDroneState();
    }, intervalMs);
    window.addEventListener("via1:drone-changed", fetchDroneState);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("via1:drone-changed", fetchDroneState);
    };
  }, [droneActive, fetchDroneState]);
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
  const [spinnereiEvent, setSpinnereiEvent] = useState<{
    title: string;
    dateLabel: string;
    startTime: string;
    timeRange: string;
    startAt: string; // ISO, fuer isToday-Check
  } | null>(null);
  const [laundrySpinning, setLaundrySpinning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spinnerei/next-event")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            event: {
              title: string;
              startAt: string;
              endAt: string | null;
            } | null;
          } | null
        ) => {
          if (cancelled || !data?.event) return;
          const start = new Date(data.event.startAt);
          if (Number.isNaN(start.getTime())) return;
          const end = data.event.endAt ? new Date(data.event.endAt) : null;
          const dateLabel = start.toLocaleDateString("de-CH", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "Europe/Zurich",
          });
          const startTime = start.toLocaleTimeString("de-CH", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Zurich",
          });
          const endTime =
            end && !Number.isNaN(end.getTime())
              ? end.toLocaleTimeString("de-CH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Zurich",
                })
              : null;
          setSpinnereiEvent({
            title: data.event.title,
            dateLabel,
            startTime,
            timeRange: endTime ? `${startTime} – ${endTime}` : startTime,
            startAt: data.event.startAt,
          });
        }
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Pinnwand laden
  const loadPinnwand = useCallback(async () => {
    try {
      const res = await fetch("/api/pinnwand");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as PinnwandEintrag[];
      setPinnwand(data);
      writeLs("via1-home-pinnwand", data);
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

  // Sauna-Temperatur: echter Sensor (ESP32 + DS18B20). Frisch = < 2 Min alt.
  useEffect(() => {
    let cancelled = false;
    async function fetchSauna() {
      try {
        const res = await fetch("/api/sauna/current", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data: { tempTopC: number | null; ageSeconds: number | null } =
          await res.json();
        if (cancelled) return;
        if (data.tempTopC === null || data.ageSeconds === null) {
          setSaunaTemp(null);
          setSaunaLive(false);
          setSaunaAgeSec(null);
          return;
        }
        setSaunaTemp(Math.round(data.tempTopC * 10) / 10);
        setSaunaAgeSec(data.ageSeconds);
        setSaunaLive(data.ageSeconds < 120);
      } catch {
        if (cancelled) return;
        setSaunaLive(false);
      }
    }
    async function fetchHeating() {
      try {
        const res = await fetch("/api/sauna/heating", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as
          | { startedByName: string; minutesAgo: number }
          | null;
        if (!cancelled) setSaunaHeating(data);
      } catch {
        // silent
      }
    }
    fetchSauna();
    fetchHeating();
    const id = setInterval(() => {
      if (document.hidden) return;
      fetchSauna();
      fetchHeating();
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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
        const list = upcoming.slice(0, 5);
        setUpcomingTermine(list);
        writeLs("via1-home-upcomingTermine", list);
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
        const list: NextActivity[] = [...data]
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            title: a.title,
            startAt: a.startAt,
            location: a.location,
            createdBy: a.createdBy,
            participantsGoing: a.participants.filter((p) => p.going).length,
          }));
        setUpcomingActivities(list);
        writeLs("via1-home-upcomingActivities", list);
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

  // ---- Home-Bloecke (individuell anordenbar, siehe src/lib/home-layout.ts) ----
  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const renderTermin = () =>
    layout.termineCount === 1 ? (
        <div
          className={`wg-glow-border cursor-pointer rounded-full border border-accent/30 bg-accent/5 px-4 py-3 text-center transition-colors hover:bg-accent/10 ${
            nextTermin && isToday(nextTermin.date) ? "home-tile-pulse" : ""
          }`}
          style={{ ["--tile-glow-rgb" as string]: "184, 240, 104" }}
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
    ) : (
      <div
        className="wg-glow-border mb-4 cursor-pointer rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 transition-colors hover:bg-accent/10"
        style={{ ["--tile-glow-rgb" as string]: "184, 240, 104" }}
        onClick={() => router.push("/termine")}
      >
        <p className="font-display text-[9px] font-bold uppercase tracking-widest text-accent">
          TERMINE
        </p>
        {upcomingTermine.length === 0 ? (
          <p className="mt-1 text-xs text-gray-500">Keine</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {upcomingTermine.slice(0, layout.termineCount).map((t) => (
              <li
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/termine/${t.id}`);
                }}
                className={`flex items-baseline justify-between gap-3 ${
                  isToday(t.date) ? "text-accent" : ""
                }`}
              >
                <span className="truncate text-xs font-medium text-white">
                  {t.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-gray-500">
                  {fmtDay(t.date)} · {t.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

  const renderAktivitaet = () =>
    layout.aktivitaetenCount === 1 ? (
      nextActivity ? (
          <div
            className={`wg-glow-border cursor-pointer rounded-full border border-blue-400/30 bg-blue-400/5 px-4 py-3 text-center transition-colors hover:bg-blue-400/10 ${
              isToday(nextActivity.startAt) ? "home-tile-pulse" : ""
            }`}
            style={{ ["--tile-glow-rgb" as string]: "96, 165, 250" }}
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
      ) : (
          <div
            className="cursor-pointer rounded-full border border-gray-800 bg-white/5 px-4 py-3 text-center"
            onClick={() => router.push("/aktivitaeten")}
          >
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-gray-500">
              AKTIVITÄT
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
              Keine geplant
            </p>
            <p className="font-mono text-[10px] text-gray-700">—</p>
          </div>
      )
    ) : (
      <div
        className="wg-glow-border mb-4 cursor-pointer rounded-2xl border border-blue-400/30 bg-blue-400/5 px-4 py-3 transition-colors hover:bg-blue-400/10"
        style={{ ["--tile-glow-rgb" as string]: "96, 165, 250" }}
        onClick={() => router.push("/aktivitaeten")}
      >
        <p className="font-display text-[9px] font-bold uppercase tracking-widest text-blue-300">
          AKTIVITÄTEN
        </p>
        {upcomingActivities.length === 0 ? (
          <p className="mt-1 text-xs text-gray-500">Keine geplant</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {upcomingActivities
              .slice(0, layout.aktivitaetenCount)
              .map((a) => (
                <li
                  key={a.id}
                  className={`flex items-baseline justify-between gap-3 ${
                    isToday(a.startAt) ? "text-blue-300" : ""
                  }`}
                >
                  <span className="truncate text-xs font-medium text-white">
                    {a.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-gray-500">
                    {fmtDay(a.startAt)} ·{" "}
                    {new Date(a.startAt).toLocaleTimeString("de-CH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    );

  const renderSauna = () => (
        <div
          className={`wg-glow-border cursor-pointer rounded-xl border bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(255,50,50,0.1)] ${
            saunaHeating
              ? "sauna-heating-pulse border-red-500/50"
              : "border-red-500/15"
          }`}
          style={{ ["--tile-glow-rgb" as string]: "239, 68, 68" }}
          onClick={() => router.push("/sauna")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-red-400">
            SAUNA
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">
            {saunaTemp ?? "–"}°C
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {saunaHeating
              ? `🔥 ${saunaHeating.startedByName} heizt ein`
              : saunaTemp === null
                ? "Sensor offline"
                : saunaLive
                  ? saunaTemp >= 60
                    ? "geheizt 🔥"
                    : saunaTemp >= 35
                      ? "warm"
                      : "kalt"
                  : `vor ${Math.round((saunaAgeSec ?? 0) / 60)} Min`}
          </p>
          <SaunaSparkline />
        </div>
  );

  const renderAufgaben = () => (
        <div
          className="wg-glow-border cursor-pointer rounded-xl border border-yellow-400/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(255,220,50,0.1)]"
          style={{ ["--tile-glow-rgb" as string]: "250, 204, 21" }}
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
  );

  const renderPutzen = () => (
        <div
          className="wg-glow-border cursor-pointer rounded-xl border border-violet-500/15 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(150,100,255,0.1)]"
          style={{ ["--tile-glow-rgb" as string]: "139, 92, 246" }}
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-400">
            PUTZEN
          </p>
          <p className="mt-1 break-words text-sm font-semibold leading-tight text-white">
            {putzCurrentWg ?? "—"}
          </p>
          {putzPrevWg && putzPrevDate ? (
            <p className="mt-1 text-[10px] leading-tight text-gray-500">
              vorher: <span className="text-gray-300">{putzPrevWg}</span>
              <span className="text-gray-600">
                {" "}
                ·{" "}
                {new Date(putzPrevDate).toLocaleDateString("de-CH", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              {putzDaysSince !== null && (
                <span className="text-gray-600">
                  {" "}
                  ({putzDaysSince === 0
                    ? "heute"
                    : putzDaysSince === 1
                      ? "vor 1 T."
                      : `vor ${putzDaysSince} T.`})
                </span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-[10px] italic text-gray-600">
              noch nicht erfasst
            </p>
          )}
        </div>
  );

  // Animierte Wellenlinie als Trenner — eigene Gradient-ID pro Instanz,
  // weil es bis zu drei davon geben kann.
  const renderDivider = (key: string) => (
      <div className="mb-4 flex justify-center overflow-hidden">
        <svg
          viewBox="0 0 400 20"
          className="h-4 w-full max-w-lg"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10"
            fill="none"
            stroke={`url(#wave-grad-${key})`}
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
            <linearGradient id={`wave-grad-${key}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="rgba(184,240,104,0.3)" />
              <stop offset="50%" stopColor="rgba(184,240,104,0.5)" />
              <stop offset="80%" stopColor="rgba(184,240,104,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
  );

  const renderKaffee = () => (
            <div
              className="wg-glow-border cursor-pointer rounded-2xl border border-amber-600/30 bg-gradient-to-br from-amber-700/15 to-transparent p-3 transition-all hover:border-amber-500/50"
              style={{ ["--tile-glow-rgb" as string]: "217, 119, 6" }}
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
  );

  const renderSpinnerei = () => (
            <div
              className={`wg-glow-border group flex cursor-pointer flex-col rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/15 to-transparent p-3 transition-all hover:border-secondary/60 ${
                spinnereiEvent && isToday(spinnereiEvent.startAt) ? "home-tile-pulse" : ""
              }`}
              style={{ ["--tile-glow-rgb" as string]: "255, 107, 43" }}
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
                {spinnereiEvent?.title ?? "Hausfest 2026"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                {spinnereiEvent?.dateLabel ?? "Sa 5. Sept"}
              </p>
              <p className="font-mono text-[10px] text-gray-500">
                {spinnereiEvent?.timeRange ?? "16:00 – 06:00"}
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
  );

  const renderPinnwand = () => (
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
              className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/30 to-amber-600/10 rotate-1 p-3 pb-7 text-left shadow-lg transition-transform hover:rotate-0 hover:scale-105"
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
                className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.grad} ${style.rot} p-3 pb-7 shadow-lg transition-transform hover:rotate-0 hover:scale-105`}
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
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <ReactionBar
                    reactions={p.reactions ?? []}
                    toggleUrl={`/api/pinnwand/${p.id}/reactions`}
                    onChanged={loadPinnwand}
                    variant="amber"
                  />
                </div>
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
  );

  const blocks: Partial<Record<HomeBlockId, HomeBlockDef>> = {
    termin: {
      size: layout.termineCount === 1 ? "half" : "full",
      render: renderTermin,
    },
    aktivitaet: {
      size: layout.aktivitaetenCount === 1 ? "half" : "full",
      render: renderAktivitaet,
    },
    sauna: { size: "third", render: renderSauna },
    aufgaben: { size: "third", render: renderAufgaben },
    putzen: { size: "third", render: renderPutzen },
    "divider-1": { size: "full", render: () => renderDivider("1") },
    "divider-2": { size: "full", render: () => renderDivider("2") },
    "divider-3": { size: "full", render: () => renderDivider("3") },
    kochen: { size: "full", render: () => <WgKochenTile /> },
    kaffee: { size: "half", render: renderKaffee, available: hasKaffeeAbo },
    spinnerei: { size: "half", render: renderSpinnerei },
    pinnwand: { size: "full", render: renderPinnwand },
  };

  return (
    <div
      className={`relative p-4 pb-20 ${
        laundrySpinning ? "home-spin-vibration" : ""
      }`}
    >
      <TabHeader
        title={`${getGreeting()}, ${userName}`}
        icon="/pyramid.webp"
        color="green"
        scrollable
      />
      <LaundryTimers onSpinChange={setLaundrySpinning} />

      {/* Anpassen-Modus: Bloecke verschieben / ausblenden */}
      <div className="-mt-2 mb-3 flex items-center justify-end gap-3">
        {editMode && (
          <button
            type="button"
            onClick={resetLayout}
            className="font-mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-red-400"
          >
            Zurücksetzen
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
            editMode
              ? "border-accent bg-accent text-dark"
              : "border-gray-700 text-gray-500 hover:border-accent hover:text-white"
          }`}
        >
          {editMode ? "✓ Fertig" : "⚙ Anpassen"}
        </button>
      </div>

      <HomeLayoutGrid
        layout={layout}
        blocks={blocks}
        editMode={editMode}
        onChange={updateLayout}
      />

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
      {droneFlight ? (
        <DroneOverlay
          flight={droneFlight}
          onStopped={async () => {
            // Sonnenuntergang oder eigener Stop: lokal sofort weg, Server-State refreshen.
            setDroneFlight(null);
            fetchDroneState();
          }}
          onComplaintAdded={fetchDroneState}
        />
      ) : (
        <DroneHistoryButton />
      )}
    </div>
  );
}

