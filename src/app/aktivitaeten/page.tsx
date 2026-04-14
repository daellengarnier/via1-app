"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

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
  createdBy: string;
  createdById: string;
  participants: Participant[];
  myParticipation: "going" | "not-going" | null;
  comments: Comment[];
}

const TEMPLATES: { id: string; title: string; defaultLocation: string }[] = [
  { id: "aareschwumm", title: "Aareschwumm", defaultLocation: "Aare" },
  { id: "spielabend", title: "Spieleabend", defaultLocation: "Pyramide" },
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
  if (diffMin < -5) return "";
  if (diffMin < 1) return "jetzt";
  if (diffMin < 60) return `in ${diffMin} Min`;
  const hrs = Math.floor(diffMin / 60);
  if (hrs < 24) return `in ${hrs} Std`;
  return "";
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
  const [quickTimeMinutes, setQuickTimeMinutes] = useState<number | null>(0);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

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
      // z.B. "19:30" fuer heute
      const [hh, mm] = customTime.split(":").map(Number);
      const d = new Date();
      d.setHours(hh ?? 0, mm ?? 0, 0, 0);
      // Falls die Zeit in der Vergangenheit liegt, auf morgen schieben
      if (d.getTime() < Date.now() - 60000) {
        d.setDate(d.getDate() + 1);
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
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Activity;
      setActivities((prev) =>
        [...prev, created].sort((a, b) =>
          a.startAt.localeCompare(b.startAt)
        )
      );
      // Reset
      setShowCreate(false);
      setSelectedTemplate(null);
      setCustomTitle("");
      setCustomDescription("");
      setCustomLocation("");
      setCustomTime("");
      setQuickTimeMinutes(0);
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

  async function deleteActivity(id: string) {
    if (!confirm("Diese Aktivität wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActivities((prev) => prev.filter((a) => a.id !== id));
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
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] text-gray-500">oder Uhrzeit:</span>
            <input
              type="time"
              value={customTime}
              onChange={(e) => {
                setCustomTime(e.target.value);
                setQuickTimeMinutes(null);
              }}
              className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={createActivity}
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Starten
            </button>
            <button
              onClick={() => setShowCreate(false)}
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
          const myP = a.myParticipation;
          const isOwn = a.createdById === session?.user?.id;
          const isCommentsOpen = openCommentsId === a.id;
          const rel = relativeTime(a.startAt);

          return (
            <div
              key={a.id}
              className="rounded-lg border border-gray-800 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    {formatTime(a.startAt)}
                    {rel && (
                      <span className="ml-1 text-gray-500">· {rel}</span>
                    )}
                  </p>
                  <h3 className="mt-0.5 text-sm font-semibold text-white">
                    {a.title}
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
                  </p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => deleteActivity(a.id)}
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
