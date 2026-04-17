"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TabHeader } from "@/components/TabHeader";
import { WaveDivider } from "@/components/WaveDivider";

type TerminType = "sitzung" | "essen" | "sonstige";

interface Termin {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: TerminType;
  organizer: string | null;
  withDinner: boolean;
  dinnerTime: string | null;
  dinnerLocation: string | null;
  dinnerOrganizer: string | null;
  dinnerMenu: string | null;
  withAttendance: boolean;
  createdBy: string;
  createdById: string;
  mealDietCount: { fleisch: number; vegi: number; vegan: number };
  mealAllergies: string[];
  attendanceCount: number;
  myAttendance: "going" | "not-going" | null;
  myMealSignup: "going" | "not-going" | null;
  myMealGuestsCount: number;
  agendaCount: number;
  mealSignupCount: number;
  commentCount: number;
}

const wgNames = [
  "Nordwind",
  "Ostblock",
  "Dreiecksbar",
  "Kleenex",
  "Family-WG",
  "Bonzen",
  "Haus (alle)",
];

const typeLabels: Record<TerminType, string> = {
  sitzung: "Sitzung",
  essen: "Essen",
  sonstige: "Sonstige",
};

const typeBg: Record<TerminType, string> = {
  sitzung: "bg-accent",
  essen: "bg-amber-400",
  sonstige: "bg-gray-600",
};

function formatDateUpper(iso: string): string {
  // "DO. 30. APRIL 2026"
  const d = new Date(iso);
  const wd = d
    .toLocaleDateString("de-CH", { weekday: "short" })
    .replace(/\.$/, "")
    .toUpperCase();
  const day = d.getDate();
  const month = d
    .toLocaleDateString("de-CH", { month: "long" })
    .toUpperCase();
  const year = d.getFullYear();
  return `${wd}. ${day}. ${month} ${year}`;
}

// Termine werden vom API geladen

function exportIcs(termin: Termin) {
  // Naive Dauer: 2h fuer Sitzung, 3h fuer Essen, 1h fuer Sonstige
  const durationH = termin.type === "essen" ? 3 : termin.type === "sonstige" ? 1 : 2;
  const [hh, mm] = termin.time.split(":").map((s) => parseInt(s, 10));
  const start = new Date(termin.date);
  start.setHours(hh ?? 0, mm ?? 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + durationH);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${termin.id}@via1-app`;
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Via 1//Termine//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escape(termin.title)}`,
    termin.location ? `LOCATION:${escape(termin.location)}` : "",
    termin.organizer
      ? `DESCRIPTION:Organisiert von ${escape(termin.organizer)}`
      : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${termin.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TerminePage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [filter, setFilter] = useState<TerminType | "alle">("alle");
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTermine = useCallback(async () => {
    try {
      const res = await fetch("/api/termine");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Termin[];
      setTermine(data);
      setError(null);
    } catch (err) {
      console.error("Termine laden", err);
      setError("Termine konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTermine();
  }, [loadTermine]);

  // Signup state (inline, per termin)
  type GuestDiet = "Fleisch" | "Vegi" | "Vegan";
  const [signupOpen, setSignupOpen] = useState<string | null>(null);
  const [signupGuests, setSignupGuests] = useState<GuestDiet[]>([]);

  // Create form state
  const [newType, setNewType] = useState<TerminType>("sitzung");
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("19:30");
  const [newLocation, setNewLocation] = useState("");
  const [newLocationMode, setNewLocationMode] = useState<"wg" | "custom">(
    "wg"
  );
  const [newOrganizer, setNewOrganizer] = useState("");
  const [newWithDinner, setNewWithDinner] = useState(false);
  const [newDinnerTime, setNewDinnerTime] = useState("18:30");
  const [newDinnerLocation, setNewDinnerLocation] = useState("");
  const [newDinnerLocationMode, setNewDinnerLocationMode] = useState<
    "wg" | "custom"
  >("wg");
  const [newDinnerMenu, setNewDinnerMenu] = useState("");
  const [newWithAttendance, setNewWithAttendance] = useState(false);

  const WG_LOCATIONS = [
    "Nordwind",
    "Ostblock",
    "Dreiecksbar",
    "Kleenex",
    "Family-WG",
    "Bonzen",
  ];

  const filtered =
    filter === "alle"
      ? termine
      : termine.filter((t) => t.type === filter);

  // Sortierung: bevorstehende Termine aufsteigend (naechster zuerst),
  // vergangene Termine absteigend (juengster zuerst) darunter
  const todayStr = new Date().toISOString().split("T")[0]!;
  const sorted = [...filtered].sort((a, b) => {
    const aUp = a.date >= todayStr;
    const bUp = b.date >= todayStr;
    if (aUp !== bUp) return aUp ? -1 : 1;
    if (aUp) return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        title: newTitle,
        date: newDate,
        time: newTime,
        location: newLocation,
        type: newType,
        organizer: newType === "sitzung" ? newOrganizer : null,
        withDinner: newWithDinner,
        dinnerTime: newWithDinner ? newDinnerTime : null,
        dinnerLocation: newWithDinner ? newDinnerLocation : null,
        dinnerOrganizer: null,
        dinnerMenu:
          newWithDinner || newType === "essen" ? newDinnerMenu : null,
        withAttendance:
          newType === "sitzung"
            ? true
            : newType === "sonstige"
              ? newWithAttendance
              : false,
      };
      if (editingId) {
        const res = await fetch(`/api/termine/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Reload to get correct list entry (detail endpoint returns
        // a detail DTO, not list-compatible)
        await loadTermine();
      } else {
        const res = await fetch("/api/termine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created = (await res.json()) as Termin;
        setTermine((prev) => [created, ...prev]);
      }
      setShowCreate(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error("Termin speichern", err);
      alert("Konnte Termin nicht speichern.");
    }
  }

  function openEditTermin(t: Termin) {
    setEditingId(t.id);
    setNewType(t.type);
    setNewTitle(t.title);
    setNewDate(t.date);
    setNewTime(t.time);
    setNewLocation(t.location);
    setNewLocationMode(
      WG_LOCATIONS.includes(t.location) ? "wg" : "custom"
    );
    setNewOrganizer(t.organizer ?? "");
    setNewWithDinner(t.withDinner);
    setNewDinnerTime(t.dinnerTime ?? "18:30");
    setNewDinnerLocation(t.dinnerLocation ?? "");
    setNewDinnerLocationMode(
      t.dinnerLocation && WG_LOCATIONS.includes(t.dinnerLocation)
        ? "wg"
        : "custom"
    );
    setNewDinnerMenu(t.dinnerMenu ?? "");
    setNewWithAttendance(t.withAttendance);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteTermin(id: string) {
    if (!confirm("Diesen Termin wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/termine/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTermine((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Termin löschen", err);
      alert("Konnte Termin nicht löschen.");
    }
  }

  async function setAttendance(
    id: string,
    value: "going" | "not-going" | null
  ) {
    // Optimistic update
    const prev = termine;
    setTermine((ts) =>
      ts.map((t) => (t.id === id ? { ...t, myAttendance: value } : t))
    );
    try {
      const res = await fetch(`/api/termine/${id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Attendance", err);
      setTermine(prev);
      alert("Anmeldung konnte nicht gespeichert werden.");
    }
  }

  function resetForm() {
    setNewTitle("");
    setNewDate("");
    setNewTime("19:30");
    setNewLocation("");
    setNewLocationMode("wg");
    setNewOrganizer("");
    setNewWithDinner(false);
    setNewDinnerTime("18:30");
    setNewDinnerLocation("");
    setNewDinnerLocationMode("wg");
    setNewDinnerMenu("");
    setNewWithAttendance(false);
    setNewType("sitzung");
  }



  return (
    <div className="relative p-4 pb-20">
      <TabHeader icon="/icon-termine.webp" color="orange" showIcon={false} />
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-termine.webp"
          alt=""
          className="tab-btn-icon glow-orange"
          loading="eager"
          fetchPriority="high"
        />
        <WaveDivider color="orange" variant={0} />
        <button
          onClick={() => {
            if (showCreate) {
              setShowCreate(false);
              setEditingId(null);
              resetForm();
            } else {
              setEditingId(null);
              resetForm();
              setShowCreate(true);
            }
          }}
          className="rounded-full border border-orange-400/50 bg-orange-400/15 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-orange-400/25"
        >
          {editingId ? "Termin bearbeiten" : "+ Neuer Termin"}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4"
        >
          {/* Kategorie — nur bei neuem Termin (Typ bleibt beim Bearbeiten) */}
          {!editingId && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-400">
                Kategorie
              </label>
              <div className="flex gap-2">
                {(["sitzung", "essen", "sonstige"] as TerminType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={`flex-1 rounded-lg py-2 font-mono text-xs font-bold transition-colors ${
                      newType === t
                        ? `${typeBg[t]} text-dark`
                        : "border border-gray-700 text-gray-400"
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              {newType === "sitzung" ? "Name der Sitzung" : "Titel"}
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={
                newType === "sitzung"
                  ? "z.B. Haussitzung Mai"
                  : newType === "essen"
                    ? "z.B. Sommeressen"
                    : "z.B. Putzaktion"
              }
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
              required
            />
          </div>

          {/* Organisierende WG (nur bei Sitzung) */}
          {newType === "sitzung" && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-400">
                Organisiert von
              </label>
              <select
                value={newOrganizer}
                onChange={(e) => setNewOrganizer(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                required
              >
                <option value="">WG wählen...</option>
                {wgNames.map((wg) => (
                  <option key={wg} value={wg}>
                    {wg}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Datum & Zeit */}
          <div className="mb-3 grid grid-cols-[3fr_2fr] gap-2">
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-gray-400">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs leading-[1.25rem] text-white focus:border-orange-400 focus:outline-none"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs text-gray-400">Zeit</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="box-border block h-10 w-full min-w-0 appearance-none rounded border border-gray-700 bg-gray-900 px-2 text-xs leading-[1.25rem] text-white focus:border-orange-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Ort — WG-Picker oder Freitext */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs text-gray-400">Ort</label>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setNewLocationMode("wg")}
                  className={`rounded px-2 py-0.5 font-mono uppercase ${
                    newLocationMode === "wg"
                      ? "bg-orange-400 text-black"
                      : "border border-gray-700 text-gray-500"
                  }`}
                >
                  WG
                </button>
                <button
                  type="button"
                  onClick={() => setNewLocationMode("custom")}
                  className={`rounded px-2 py-0.5 font-mono uppercase ${
                    newLocationMode === "custom"
                      ? "bg-orange-400 text-black"
                      : "border border-gray-700 text-gray-500"
                  }`}
                >
                  Anderer Ort
                </button>
              </div>
            </div>
            {newLocationMode === "wg" ? (
              <div className="grid grid-cols-3 gap-2">
                {WG_LOCATIONS.map((wg) => (
                  <button
                    key={wg}
                    type="button"
                    onClick={() => setNewLocation(wg)}
                    className={`rounded border px-2 py-2 text-xs transition-colors ${
                      newLocation === wg
                        ? "border-orange-400 bg-orange-400/10 text-orange-200"
                        : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {wg}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="z.B. Gemeinschaftsraum EG, Innenhof, …"
                className="w-full min-w-0 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
              />
            )}
          </div>

          {/* Mit Teilnahmeliste (nur bei Sonstige) */}
          {newType === "sonstige" && (
            <div className="mb-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-white/5 p-3">
                <div>
                  <span className="text-sm text-white">
                    Mit Teilnahmeliste
                  </span>
                  <p className="text-[10px] text-gray-500">
                    An- und Abmeldungen im Termin sichtbar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewWithAttendance(!newWithAttendance)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    newWithAttendance ? "bg-orange-400" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      newWithAttendance ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Mit Essen (bei Sitzung) */}
          {newType === "sitzung" && (
            <div className="mb-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-white/5 p-3">
                <span className="text-sm text-white">Mit Essen</span>
                <button
                  type="button"
                  onClick={() => setNewWithDinner(!newWithDinner)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    newWithDinner ? "bg-orange-400" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      newWithDinner ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              {newWithDinner && (
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      Essenszeit
                    </label>
                    <input
                      type="time"
                      value={newDinnerTime}
                      onChange={(e) => setNewDinnerTime(e.target.value)}
                      className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs text-gray-400">
                        Ort des Essens
                      </label>
                      <div className="flex gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setNewDinnerLocationMode("wg")}
                          className={`rounded px-2 py-0.5 font-mono uppercase ${
                            newDinnerLocationMode === "wg"
                              ? "bg-orange-400 text-black"
                              : "border border-gray-700 text-gray-500"
                          }`}
                        >
                          WG
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDinnerLocationMode("custom")}
                          className={`rounded px-2 py-0.5 font-mono uppercase ${
                            newDinnerLocationMode === "custom"
                              ? "bg-orange-400 text-black"
                              : "border border-gray-700 text-gray-500"
                          }`}
                        >
                          Anderer Ort
                        </button>
                      </div>
                    </div>
                    {newDinnerLocationMode === "wg" ? (
                      <div className="grid grid-cols-3 gap-2">
                        {WG_LOCATIONS.map((wg) => (
                          <button
                            key={wg}
                            type="button"
                            onClick={() => setNewDinnerLocation(wg)}
                            className={`rounded border px-2 py-2 text-xs transition-colors ${
                              newDinnerLocation === wg
                                ? "border-orange-400 bg-orange-400/10 text-orange-200"
                                : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            {wg}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newDinnerLocation}
                        onChange={(e) => setNewDinnerLocation(e.target.value)}
                        placeholder="z.B. Pyramide, Innenhof, …"
                        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-400 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      Was gibt&apos;s zu essen?{" "}
                      <span className="text-gray-600">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newDinnerMenu}
                      onChange={(e) => setNewDinnerMenu(e.target.value)}
                      placeholder="z.B. Lasagne mit Salat"
                      className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {newType === "essen" && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-400">
                Was gibt&apos;s zu essen?{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={newDinnerMenu}
                onChange={(e) => setNewDinnerMenu(e.target.value)}
                placeholder="z.B. Lasagne mit Salat"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-400 focus:outline-none"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-orange-400 px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              {editingId ? "Speichern" : "Erstellen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditingId(null);
                resetForm();
              }}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="mb-4 flex justify-center gap-2">
        {(["alle", "sitzung", "essen", "sonstige"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              filter === f
                ? "bg-orange-400 text-black"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {f === "alle" ? "Alle" : typeLabels[f]}
          </button>
        ))}
      </div>

      {/* Liste — kompakt */}
      <div className="space-y-2">
        {sorted.map((t) => {
          const hasEssen = t.type === "essen" || t.withDinner;
          const isOwner = t.createdById === currentUserId;
          const canEdit = isOwner || isAdmin;
          const showSitzungBadge = t.type === "sitzung";
          const sitzungTime = t.time;
          const essenTime = t.type === "essen" ? t.time : t.dinnerTime ?? "";
          const essenLocation =
            t.type === "essen" ? t.location : t.dinnerLocation ?? "";
          const diet = t.mealDietCount;
          return (
            <div
              key={t.id}
              className="rounded-lg border border-gray-800 bg-white/5 p-3 transition-colors hover:border-gray-700"
            >
              {/* Kopf: Datum + Aktionen */}
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300">
                  {formatDateUpper(t.date)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => exportIcs(t)}
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] text-gray-500 hover:text-orange-300"
                    title="In Kalender exportieren"
                  >
                    📅
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => openEditTermin(t)}
                        className="rounded px-1.5 py-0.5 text-[12px] text-gray-500 hover:text-orange-300"
                        title="Bearbeiten"
                        aria-label="Termin bearbeiten"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTermin(t.id)}
                        className="rounded px-1.5 py-0.5 text-[14px] leading-none text-gray-500 hover:text-red-400"
                        title="Löschen"
                        aria-label="Termin löschen"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>

              <Link href={`/termine/${t.id}`} className="block">
                {/* Titel */}
                <h3 className="mt-0.5 text-sm font-medium text-white">
                  {t.title}
                  {t.type === "sitzung" && t.withDinner && (
                    <> inkl. Nachtessen</>
                  )}
                </h3>
                {/* Organisator (eigene Zeile) */}
                {t.organizer && (
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    organisiert von {t.organizer}
                  </p>
                )}
                {t.type === "sonstige" && t.createdBy && !t.organizer && (
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    erstellt von {t.createdBy}
                  </p>
                )}

                {/* Badges mit Zeit + Anmeldezahlen */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {showSitzungBadge && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent ring-1 ring-accent/40">
                      SITZUNG · {sitzungTime}
                      {t.withAttendance && (
                        <span className="font-normal text-accent/80">
                          · {t.attendanceCount} dabei
                        </span>
                      )}
                    </span>
                  )}
                  {hasEssen && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/40">
                      ESSEN · {essenTime}
                      <span className="font-normal text-amber-200/90">
                        · {t.mealSignupCount}
                      </span>
                      {t.mealSignupCount > 0 && (
                        <span className="font-normal text-amber-200/70">
                          ({diet.fleisch} 🍖 {diet.vegi} 🥗 {diet.vegan} 🌱)
                        </span>
                      )}
                    </span>
                  )}
                  {t.type === "sonstige" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-600/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gray-300 ring-1 ring-gray-600/40">
                      {t.time}
                      {t.withAttendance && (
                        <span className="font-normal text-gray-400">
                          · {t.attendanceCount} dabei
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Ort(e) */}
                {(t.location || essenLocation) && (
                  <p className="mt-1 text-[10px] text-gray-500">
                    {showSitzungBadge && t.location && (
                      <>📍 Sitzung: {t.location}</>
                    )}
                    {showSitzungBadge &&
                      t.location &&
                      hasEssen &&
                      essenLocation && <> · </>}
                    {hasEssen && essenLocation && (
                      <>
                        {!showSitzungBadge && "📍 "}
                        {showSitzungBadge ? "Essen: " : "Essen: "}
                        {essenLocation}
                      </>
                    )}
                    {!showSitzungBadge && !hasEssen && t.location && (
                      <>📍 {t.location}</>
                    )}
                  </p>
                )}
                {t.dinnerMenu && (
                  <p className="mt-0.5 text-[10px] italic text-gray-500">
                    🍽 {t.dinnerMenu}
                  </p>
                )}

                {/* Allergien */}
                {hasEssen && t.mealAllergies.length > 0 && (
                  <p className="mt-1 text-[10px] text-amber-200/70">
                    ⚠ {t.mealAllergies.join(", ")}
                  </p>
                )}

                {(t.agendaCount > 0 || t.commentCount > 0) && (
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-600">
                    {t.agendaCount > 0 && (
                      <span>{t.agendaCount} Traktanden</span>
                    )}
                    {t.commentCount > 0 && (
                      <span>💬 {t.commentCount}</span>
                    )}
                  </div>
                )}
              </Link>

              {/* Sitzungs-Teilnahme (bei Termin mit Attendance) */}
              {t.withAttendance && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-16 shrink-0 font-display text-[9px] font-bold uppercase tracking-wider text-accent">
                    Sitzung
                  </span>
                  <button
                    onClick={() =>
                      setAttendance(
                        t.id,
                        t.myAttendance === "going" ? null : "going"
                      )
                    }
                    className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      t.myAttendance === "going"
                        ? "bg-accent text-dark"
                        : "border border-accent/40 text-accent hover:bg-accent/10"
                    }`}
                  >
                    {t.myAttendance === "going" ? "✓ Dabei" : "Anmelden"}
                  </button>
                  <button
                    onClick={() =>
                      setAttendance(
                        t.id,
                        t.myAttendance === "not-going" ? null : "not-going"
                      )
                    }
                    className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      t.myAttendance === "not-going"
                        ? "bg-gray-600 text-white"
                        : "border border-gray-700 text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    {t.myAttendance === "not-going"
                      ? "✗ Abgemeldet"
                      : "Abmelden"}
                  </button>
                </div>
              )}

              {/* Essens-Anmeldung */}
              {hasEssen && signupOpen !== t.id && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-16 shrink-0 font-display text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    Essen
                  </span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (t.myMealSignup === "going") {
                        // bereits angemeldet — nichts tun
                        return;
                      }
                      if (t.myMealSignup === "not-going") {
                        // Re-aktivieren via PATCH goingSelf=true
                        try {
                          const res = await fetch(
                            `/api/termine/${t.id}/meal-signup`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ goingSelf: true }),
                            }
                          );
                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          await loadTermine();
                        } catch (err) {
                          console.error("Anmelden", err);
                          alert("Anmelden fehlgeschlagen.");
                        }
                        return;
                      }
                      // Noch keine Entscheidung — Gaste-Formular oeffnen
                      setSignupOpen(t.id);
                      setSignupGuests([]);
                    }}
                    className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      t.myMealSignup === "going"
                        ? "bg-amber-400 text-dark"
                        : "border border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                    }`}
                  >
                    {t.myMealSignup === "going" ? "✓ Dabei" : "Anmelden"}
                  </button>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      // Wenn bereits abgemeldet, nichts tun (oder Toggle)
                      if (t.myMealSignup === "not-going") return;

                      // Wenn angemeldet und Gaeste vorhanden — fragen ob
                      // auch Gaeste abmelden
                      if (
                        t.myMealSignup === "going" &&
                        t.myMealGuestsCount > 0
                      ) {
                        const scope = confirm(
                          `Auch deine ${t.myMealGuestsCount} Gäste abmelden?\n\n` +
                            `OK = alle abmelden\n` +
                            `Abbrechen = nur dich abmelden (Gäste bleiben)`
                        );
                        try {
                          if (scope) {
                            // Alles loeschen
                            const res = await fetch(
                              `/api/termine/${t.id}/meal-signup`,
                              { method: "DELETE" }
                            );
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          } else {
                            // Nur mich abmelden
                            const res = await fetch(
                              `/api/termine/${t.id}/meal-signup`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ goingSelf: false }),
                              }
                            );
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          }
                          await loadTermine();
                        } catch (err) {
                          console.error("Abmelden", err);
                          alert("Abmelden fehlgeschlagen.");
                        }
                        return;
                      }

                      // Angemeldet ohne Gaeste: einfach DELETE
                      if (t.myMealSignup === "going") {
                        if (
                          !confirm("Dich wirklich vom Essen abmelden?")
                        )
                          return;
                        try {
                          const res = await fetch(
                            `/api/termine/${t.id}/meal-signup`,
                            { method: "DELETE" }
                          );
                          if (!res.ok) throw new Error(`HTTP ${res.status}`);
                          await loadTermine();
                        } catch (err) {
                          console.error("Abmelden", err);
                          alert("Abmelden fehlgeschlagen.");
                        }
                        return;
                      }

                      // Noch keine Entscheidung — direkt als "nicht dabei"
                      // markieren (PATCH anlegen mit goingSelf=false)
                      try {
                        const res = await fetch(
                          `/api/termine/${t.id}/meal-signup`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ goingSelf: false }),
                          }
                        );
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        await loadTermine();
                      } catch (err) {
                        console.error("Abmelden", err);
                        alert("Abmelden fehlgeschlagen.");
                      }
                    }}
                    className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      t.myMealSignup === "not-going"
                        ? "bg-gray-600 text-white"
                        : "border border-gray-700 text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    {t.myMealSignup === "not-going"
                      ? "✗ Abgemeldet"
                      : "Abmelden"}
                  </button>
                </div>
              )}

              {/* Inline-Form für Essens-Anmeldung */}
              {hasEssen && signupOpen === t.id && (
                <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Anmeldung
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSignupOpen(null);
                        setSignupGuests([]);
                      }}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      ×
                    </button>
                  </div>

                  <p className="mb-2 text-[10px] text-gray-500">
                    Deine Ernährung wird aus dem Profil übernommen.
                  </p>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-gray-300">
                      Gäste ({signupGuests.length})
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSignupGuests((g) => [...g, "Fleisch"]);
                      }}
                      className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-400/30"
                    >
                      + Gast
                    </button>
                  </div>

                  {signupGuests.map((g, gi) => (
                    <div
                      key={gi}
                      className="mb-1.5 rounded border border-amber-400/20 bg-white/5 p-1.5"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                          Gast {gi + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSignupGuests((prev) =>
                              prev.filter((_, i) => i !== gi)
                            );
                          }}
                          className="text-[10px] text-gray-500 hover:text-red-400"
                        >
                          entfernen
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {(["Fleisch", "Vegi", "Vegan"] as GuestDiet[]).map((d) => (
                          <button
                            key={d}
                            onClick={(e) => {
                              e.preventDefault();
                              setSignupGuests((prev) =>
                                prev.map((x, i) => (i === gi ? d : x))
                              );
                            }}
                            className={`flex-1 rounded py-1 font-mono text-[10px] transition-colors ${
                              g === d
                                ? "bg-amber-400 text-dark"
                                : "border border-gray-700 text-gray-400 hover:text-white"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch(
                          `/api/termine/${t.id}/meal-signup`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              diet: "Fleisch",
                              allergies: "",
                              guests: signupGuests.map((d) => ({
                                diet: d,
                                allergies: "",
                              })),
                            }),
                          }
                        );
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        // Refetch um myMealSignup + Count korrekt zu
                        // bekommen
                        await loadTermine();
                        setSignupOpen(null);
                        setSignupGuests([]);
                      } catch (err) {
                        console.error("Essens-Anmeldung", err);
                        alert("Anmeldung fehlgeschlagen.");
                      }
                    }}
                    className="mt-1 w-full rounded-full bg-amber-400 py-1.5 text-[10px] font-bold uppercase tracking-wider text-dark"
                  >
                    Anmelden
                    {signupGuests.length > 0 && ` (+${signupGuests.length})`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && sorted.length === 0 && (
        <p className="mt-8 text-center text-gray-600">Lade Termine …</p>
      )}
      {!loading && error && (
        <p className="mt-8 text-center text-sm text-red-400">{error}</p>
      )}
      {!loading && !error && sorted.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Termine in dieser Ansicht.
        </p>
      )}
    </div>
  );
}
