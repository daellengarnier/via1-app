"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { WaveDivider } from "@/components/WaveDivider";

interface Participant {
  userId: string;
  name: string;
  going: boolean;
}

interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  startAt: string; // ISO
  recurrenceGroupId: string | null;
  createdBy: string;
  createdById: string;
  participants: Participant[];
  myParticipation: "going" | "not-going" | null;
  comments: Comment[];
}

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  NONE: "Einmalig",
  DAILY: "Täglich",
  WEEKLY: "Wöchentlich",
  MONTHLY: "Monatlich",
};

const DEFAULT_RECURRENCE_COUNT: Record<Recurrence, number> = {
  NONE: 1,
  DAILY: 14,
  WEEKLY: 8,
  MONTHLY: 6,
};

const TEMPLATES: { id: string; title: string; defaultLocation: string }[] = [
  { id: "aareschwumm", title: "Aareschwumm", defaultLocation: "Aare" },
  { id: "spielabend", title: "Spieleabend", defaultLocation: "Pyramide" },
  {
    id: "sonnenuntergang",
    title: "Sonnenuntergang schauen",
    defaultLocation: "Dach",
  },
];

const QUICK_TIMES = [
  { label: "Jetzt", minutes: 0 },
  { label: "+10 Min", minutes: 10 },
  { label: "+30 Min", minutes: 30 },
  { label: "+1 Std", minutes: 60 },
  { label: "+2 Std", minutes: 120 },
];

function combineDateTime(minutesFromNow: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesFromNow);
  return d.toISOString();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return `Heute ${time}`;
  if (isTomorrow) return `Morgen ${time}`;
  return d.toLocaleString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((then - now) / 60000);
  // Laeuft jetzt: ab Startzeitpunkt bis 60min danach
  if (diffMin <= 0 && diffMin > -60) return "läuft jetzt";
  if (diffMin < -60) return "";
  if (diffMin < 1) return "jetzt";
  if (diffMin < 60) return `in ${diffMin} Min`;
  const hrs = Math.floor(diffMin / 60);
  if (hrs < 24) return `in ${hrs} Std`;
  return "";
}

function isRunning(iso: string): boolean {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((then - now) / 60000);
  return diffMin <= 0 && diffMin > -60;
}

export default function AktivitaetenPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [quickTimeMinutes, setQuickTimeMinutes] = useState<number | null>(0);
  const [recurrence, setRecurrence] = useState<Recurrence>("NONE");
  const [recurrenceCount, setRecurrenceCount] = useState<number>(1);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  );

  const loadActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Activity[];
      setActivities(data);
    } catch (err) {
      console.error("Activities laden", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    const id = setInterval(loadActivities, 60000);
    return () => clearInterval(id);
  }, [loadActivities]);

  async function createActivity() {
    const template = TEMPLATES.find((t) => t.id === selectedTemplate);
    const title = template ? template.title : customTitle.trim();
    if (!title) {
      alert("Bitte Vorlage wählen oder Titel eingeben");
      return;
    }

    // Zeit bestimmen
    let startAt: string;
    if (customTime) {
      // z.B. "19:30" — optional auf gewaehltem Datum
      const [hh, mm] = customTime.split(":").map(Number);
      let d: Date;
      if (customDate) {
        // customDate im Format YYYY-MM-DD
        d = new Date(`${customDate}T00:00:00`);
        d.setHours(hh ?? 0, mm ?? 0, 0, 0);
      } else {
        d = new Date();
        d.setHours(hh ?? 0, mm ?? 0, 0, 0);
        // Falls die Zeit heute schon vorbei ist, auf morgen schieben
        if (d.getTime() < Date.now() - 60000) {
          d.setDate(d.getDate() + 1);
        }
      }
      startAt = d.toISOString();
    } else if (quickTimeMinutes !== null) {
      startAt = combineDateTime(quickTimeMinutes);
    } else {
      alert("Bitte Zeit angeben");
      return;
    }

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: customDescription,
          location: template ? template.defaultLocation : customLocation,
          startAt,
          recurrence,
          recurrenceCount:
            recurrence === "NONE" ? 1 : Math.max(1, recurrenceCount),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Bei Serie ist die Response nur die erste Instanz — darum
      // refetchen wir die Liste, um alle neuen Instanzen zu bekommen
      if (recurrence !== "NONE") {
        await loadActivities();
      } else {
        const created = (await res.json()) as Activity;
        setActivities((prev) =>
          [...prev, created].sort((a, b) =>
            a.startAt.localeCompare(b.startAt)
          )
        );
      }
      // Reset
      setShowCreate(false);
      setSelectedTemplate(null);
      setCustomTitle("");
      setCustomDescription("");
      setCustomLocation("");
      setCustomTime("");
      setCustomDate("");
      setQuickTimeMinutes(0);
      setRecurrence("NONE");
      setRecurrenceCount(1);
    } catch (err) {
      console.error("Activity erstellen", err);
      alert("Konnte Aktivität nicht erstellen.");
    }
  }

  async function setParticipation(
    id: string,
    status: "going" | "not-going" | null
  ) {
    // Optimistic update
    const prev = activities;
    setActivities((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const filtered = a.participants.filter(
          (p) => p.userId !== session?.user?.id
        );
        const updated =
          status !== null
            ? [
                ...filtered,
                {
                  userId: session?.user?.id ?? "",
                  name: session?.user?.name ?? "",
                  going: status === "going",
                },
              ]
            : filtered;
        return { ...a, participants: updated, myParticipation: status };
      })
    );
    try {
      const res = await fetch(`/api/activities/${id}/participation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Participation", err);
      setActivities(prev);
    }
  }

  async function addComment(activityId: string) {
    const text = newComment.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Comment;
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? { ...a, comments: [...a.comments, created] }
            : a
        )
      );
      setNewComment("");
    } catch (err) {
      console.error("Kommentar", err);
      alert("Kommentar fehlgeschlagen.");
    }
  }

  function openEditActivity(a: Activity) {
    setEditingActivityId(a.id);
    setSelectedTemplate(null);
    setCustomTitle(a.title);
    setCustomDescription(a.description);
    setCustomLocation(a.location);
    const d = new Date(a.startAt);
    setCustomDate(d.toISOString().split("T")[0]!);
    setCustomTime(
      d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
    );
    setQuickTimeMinutes(null);
    setRecurrence("NONE");
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEditActivity() {
    if (!editingActivityId || !customTitle.trim()) return;
    let startAt: string;
    if (customTime && customDate) {
      const [hh, mm] = customTime.split(":").map(Number);
      const d = new Date(`${customDate}T00:00:00`);
      d.setHours(hh ?? 0, mm ?? 0, 0, 0);
      startAt = d.toISOString();
    } else {
      alert("Bitte Datum und Zeit angeben");
      return;
    }
    try {
      const res = await fetch(`/api/activities/${editingActivityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle,
          description: customDescription,
          location: customLocation,
          startAt,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Activity;
      setActivities((prev) =>
        prev
          .map((a) => (a.id === editingActivityId ? updated : a))
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
      );
      setShowCreate(false);
      setEditingActivityId(null);
      setCustomTitle("");
      setCustomDescription("");
      setCustomLocation("");
      setCustomTime("");
      setCustomDate("");
    } catch (err) {
      console.error("Activity bearbeiten", err);
      alert("Konnte Aktivität nicht speichern.");
    }
  }

  async function deleteActivity(activity: Activity) {
    let scope: "one" | "all" = "one";
    if (activity.recurrenceGroupId) {
      // Mehrfach-Dialog: Serie oder einzelne Instanz
      const all = confirm(
        `Diese Aktivität gehört zu einer Serie.\n\n` +
          `OK = alle kommenden Instanzen dieser Serie löschen\n` +
          `Abbrechen = nur diese Instanz löschen`
      );
      if (all) {
        scope = "all";
      } else {
        // User hat Abbrechen gewaehlt — nochmal bestaetigen fuer Einzelloeschung
        if (!confirm("Nur diese eine Instanz löschen?")) return;
      }
    } else {
      if (!confirm("Diese Aktivität wirklich löschen?")) return;
    }
    try {
      const res = await fetch(
        `/api/activities/${activity.id}?scope=${scope}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (scope === "all" && activity.recurrenceGroupId) {
        // Alle Instanzen der Serie ab startAt entfernen
        setActivities((prev) =>
          prev.filter(
            (a) =>
              a.recurrenceGroupId !== activity.recurrenceGroupId ||
              a.startAt < activity.startAt
          )
        );
      } else {
        setActivities((prev) => prev.filter((a) => a.id !== activity.id));
      }
    } catch (err) {
      console.error("Activity loeschen", err);
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/pic-aktivitaeten.webp"
        glowClass="glow-blue"
        showIcon={false}
      />
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-aktivitaeten.webp"
          alt=""
          className="tab-btn-icon glow-blue"
          loading="eager"
          fetchPriority="high"
        />
        <WaveDivider color="blue" variant={3} />
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full border border-blue-400/50 bg-blue-400/15 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-blue-400/25"
        >
          + Neue Aktivität
        </button>
      </div>

      {/* Erstellen-Formular */}
      {showCreate && (
        <div className="mb-4 rounded-lg border border-blue-400/30 bg-blue-400/5 p-4">
          {/* Vorlagen */}
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
            VORLAGE
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(selectedTemplate === t.id ? null : t.id);
                  setCustomTitle("");
                }}
                className={`rounded border px-3 py-2 text-xs transition-colors ${
                  selectedTemplate === t.id
                    ? "border-accent bg-blue-400/20 text-blue-300"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Oder eigener Titel */}
          {!selectedTemplate && (
            <>
              <p className="mb-2 mt-3 font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
                ODER EIGENE AKTIVITÄT
              </p>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Titel, z.B. 'Yoga', 'Kaffee trinken'..."
                className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Ort (optional)"
                className="mb-2 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
              />
            </>
          )}

          <input
            type="text"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            placeholder="Infos / Treffpunkt (optional)"
            className="mb-3 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />

          {/* Zeit */}
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
            WANN?
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_TIMES.map((qt) => (
              <button
                key={qt.label}
                type="button"
                onClick={() => {
                  setQuickTimeMinutes(qt.minutes);
                  setCustomTime("");
                }}
                className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold transition-colors ${
                  quickTimeMinutes === qt.minutes && !customTime
                    ? "bg-blue-400 text-dark"
                    : "border border-gray-700 text-gray-400"
                }`}
              >
                {qt.label}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <p className="mb-1 text-[10px] text-gray-500">
              oder Datum & Uhrzeit:
            </p>
            <div className="grid grid-cols-[3fr_2fr] gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setQuickTimeMinutes(null);
                }}
                className="box-border block h-9 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-blue-400 focus:outline-none"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  setQuickTimeMinutes(null);
                }}
                className="box-border block h-9 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs text-white focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Wiederholung */}
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-blue-300">
            WIEDERHOLEN
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(["NONE", "DAILY", "WEEKLY", "MONTHLY"] as Recurrence[]).map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRecurrence(r);
                    setRecurrenceCount(DEFAULT_RECURRENCE_COUNT[r]);
                  }}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold transition-colors ${
                    recurrence === r
                      ? "bg-blue-400 text-dark"
                      : "border border-gray-700 text-gray-400"
                  }`}
                >
                  {RECURRENCE_LABELS[r]}
                </button>
              )
            )}
          </div>
          {recurrence !== "NONE" && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Anzahl:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={recurrenceCount}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) {
                    setRecurrenceCount(Math.min(60, Math.max(1, n)));
                  }
                }}
                className="w-16 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-blue-400 focus:outline-none"
              />
              <span className="text-[10px] text-gray-500">
                {recurrence === "DAILY"
                  ? "Tage"
                  : recurrence === "WEEKLY"
                    ? "Wochen"
                    : "Monate"}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={
                editingActivityId ? saveEditActivity : createActivity
              }
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              {editingActivityId ? "Speichern" : "Starten"}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setEditingActivityId(null);
              }}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-2">
        {activities.map((a) => {
          const goingCount = a.participants.filter((p) => p.going).length;
          const notGoingCount = a.participants.filter((p) => !p.going).length;
          const myP = a.myParticipation;
          const isOwn = a.createdById === session?.user?.id;
          const isCommentsOpen = openCommentsId === a.id;
          const rel = relativeTime(a.startAt);
          const running = isRunning(a.startAt);

          return (
            <div
              key={a.id}
              className={`rounded-lg border p-3 ${
                running
                  ? "border-blue-400/70 bg-blue-400/10 shadow-[0_0_20px_rgba(96,165,250,0.2)]"
                  : "border-gray-800 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    {formatTime(a.startAt)}
                    {rel && !running && (
                      <span className="ml-1 text-gray-500">· {rel}</span>
                    )}
                    {running && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-200 ring-1 ring-blue-400/50">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                        LÄUFT
                      </span>
                    )}
                  </p>
                  <h3 className="mt-0.5 flex items-center gap-1.5 font-display text-base font-bold uppercase tracking-wider text-white">
                    <span>{a.title}</span>
                    {a.recurrenceGroupId && (
                      <span
                        className="text-[10px] text-blue-300/80"
                        title="Wiederkehrende Aktivität"
                      >
                        🔁
                      </span>
                    )}
                  </h3>
                  {a.location && (
                    <p className="text-xs text-gray-500">📍 {a.location}</p>
                  )}
                  {a.description && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {a.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-gray-600">
                    von {a.createdBy} · 🙋 {goingCount} dabei
                    {notGoingCount > 0 && (
                      <span className="text-gray-700">
                        {" · "}✗ {notGoingCount} abgesagt
                      </span>
                    )}
                  </p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => openEditActivity(a)}
                    className="text-[11px] text-blue-300/70 hover:text-blue-200"
                    aria-label="Bearbeiten"
                  >
                    ✎
                  </button>
                )}
                {isOwn && (
                  <button
                    onClick={() => deleteActivity(a)}
                    className="text-[10px] text-gray-600 hover:text-red-400"
                    aria-label="Loeschen"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* An-/Abmelden */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    setParticipation(a.id, myP === "going" ? null : "going")
                  }
                  className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    myP === "going"
                      ? "bg-blue-400 text-dark"
                      : "border border-blue-400/40 text-blue-300 hover:bg-blue-400/10"
                  }`}
                >
                  {myP === "going" ? "✓ Dabei" : "Dabei"}
                </button>
                <button
                  onClick={() =>
                    setParticipation(
                      a.id,
                      myP === "not-going" ? null : "not-going"
                    )
                  }
                  className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    myP === "not-going"
                      ? "bg-gray-600 text-white"
                      : "border border-gray-700 text-gray-500 hover:bg-white/5"
                  }`}
                >
                  {myP === "not-going" ? "✗ Nein" : "Nein"}
                </button>
              </div>

              {/* Teilnehmer */}
              {a.participants.filter((p) => p.going).length > 0 && (
                <p className="mt-2 text-[10px] text-gray-500">
                  Dabei:{" "}
                  {a.participants
                    .filter((p) => p.going)
                    .map((p) => p.name)
                    .join(", ")}
                </p>
              )}

              {/* Kommentare */}
              <button
                onClick={() =>
                  setOpenCommentsId(isCommentsOpen ? null : a.id)
                }
                className="mt-2 flex items-center gap-1 font-mono text-[10px] text-gray-500 hover:text-blue-300"
              >
                💬 {a.comments.length}{" "}
                {isCommentsOpen ? "ausblenden" : "Kommentare"}
              </button>
              {isCommentsOpen && (
                <div className="mt-2 border-t border-gray-800 pt-2">
                  <div className="space-y-1.5">
                    {a.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded border-l-2 border-blue-400/40 bg-white/3 py-1 pl-2 pr-2"
                      >
                        <p className="text-xs text-gray-300">{c.text}</p>
                        <p className="mt-0.5 text-[9px] text-gray-600">
                          — {c.author}
                        </p>
                      </div>
                    ))}
                    {a.comments.length === 0 && (
                      <p className="text-xs text-gray-600">
                        Noch keine Kommentare
                      </p>
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addComment(a.id);
                    }}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Kommentar..."
                      className="flex-1 rounded border border-gray-800 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-blue-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded bg-accent px-3 py-1.5 text-[10px] font-bold text-dark"
                    >
                      OK
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && activities.length === 0 && (
        <p className="mt-8 text-center text-gray-600">Lade …</p>
      )}
      {!loading && activities.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-500">
          Keine Aktivitäten geplant.
          <br />
          <span className="text-xs text-gray-600">
            Erstelle eine neue Aktivität oben 👆
          </span>
        </p>
      )}
    </div>
  );
}
