"use client";

import { useState } from "react";
import Link from "next/link";
import { TabHeader } from "@/components/TabHeader";

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
  agendaCount: number;
  mealSignups: number;
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

const typeColors: Record<TerminType, string> = {
  sitzung: "text-orange-300",
  essen: "text-secondary",
  sonstige: "text-gray-400",
};

const typeBg: Record<TerminType, string> = {
  sitzung: "bg-orange-400",
  essen: "bg-secondary",
  sonstige: "bg-gray-600",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const initialTermine: Termin[] = [
  {
    id: "1",
    title: "Haussitzung April",
    date: "2026-04-16",
    time: "19:30",
    location: "Gemeinschaftsraum EG",
    type: "sitzung",
    organizer: "Dreiecksbar",
    withDinner: true,
    dinnerTime: "18:30",
    agendaCount: 3,
    mealSignups: 12,
  },
  {
    id: "2",
    title: "Hausessen Frühling",
    date: "2026-04-25",
    time: "18:00",
    location: "Innenhof",
    type: "essen",
    organizer: null,
    withDinner: false,
    dinnerTime: null,
    agendaCount: 0,
    mealSignups: 18,
  },
  {
    id: "3",
    title: "Haussitzung März",
    date: "2026-03-19",
    time: "19:30",
    location: "Gemeinschaftsraum EG",
    type: "sitzung",
    organizer: "Nordwind",
    withDinner: false,
    dinnerTime: null,
    agendaCount: 5,
    mealSignups: 0,
  },
];

export default function TerminePage() {
  const [filter, setFilter] = useState<TerminType | "alle">("alle");
  const [termine, setTermine] = useState(initialTermine);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newType, setNewType] = useState<TerminType>("sitzung");
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("19:30");
  const [newLocation, setNewLocation] = useState("");
  const [newOrganizer, setNewOrganizer] = useState("");
  const [newWithDinner, setNewWithDinner] = useState(false);
  const [newDinnerTime, setNewDinnerTime] = useState("18:30");

  const filtered =
    filter === "alle"
      ? termine
      : termine.filter((t) => t.type === filter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const newTermin: Termin = {
      id: String(Date.now()),
      title: newTitle,
      date: newDate,
      time: newTime,
      location: newLocation,
      type: newType,
      organizer: newType === "sitzung" ? newOrganizer : null,
      withDinner: newWithDinner,
      dinnerTime: newWithDinner ? newDinnerTime : null,
      agendaCount: 0,
      mealSignups: 0,
    };
    setTermine((prev) => [newTermin, ...prev]);
    setShowCreate(false);
    resetForm();
  }

  function resetForm() {
    setNewTitle("");
    setNewDate("");
    setNewTime("19:30");
    setNewLocation("");
    setNewOrganizer("");
    setNewWithDinner(false);
    setNewDinnerTime("18:30");
    setNewType("sitzung");
  }



  return (
    <div className="relative p-4 pb-20">
      <TabHeader title="Termine" icon="/icon-termine.webp" color="orange" />
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="mb-4 rounded-full bg-orange-400 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-black"
      >
        Neuer Termin
      </button>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4"
        >
          {/* Kategorie */}
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
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Zeit</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Ort */}
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Ort</label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="z.B. Gemeinschaftsraum EG"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
            />
          </div>

          {/* Mit Abendessen (bei Sitzung) */}
          {(newType === "sitzung") && (
            <div className="mb-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                <span className="text-sm text-white">Mit Abendessen</span>
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
                <div className="mt-2">
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
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-orange-400 px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
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
      <div className="mb-4 flex gap-2">
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

      {/* Liste */}
      <div className="space-y-3">
        {sorted.map((t) => (
          <Link
            key={t.id}
            href={`/termine/${t.id}`}
            className="block rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`font-mono text-xs uppercase ${typeColors[t.type]}`}
                >
                  {typeLabels[t.type]}
                </span>
                {t.organizer && (
                  <span className="ml-2 text-xs text-gray-600">
                    {t.organizer}
                  </span>
                )}
                <h3 className="mt-1 text-lg font-medium text-white">
                  {t.title}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {formatDate(t.date)} · {t.time}
            </p>
            {t.location && (
              <p className="text-sm text-gray-500">{t.location}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              {t.agendaCount > 0 && (
                <span className="text-xs text-gray-600">
                  {t.agendaCount} Traktanden
                </span>
              )}
              {(t.withDinner || t.type === "essen") && (
                <span className="text-xs text-secondary">
                  {t.mealSignups} angemeldet
                  {t.dinnerTime && ` · Essen ${t.dinnerTime}`}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Termine in dieser Ansicht.
        </p>
      )}
    </div>
  );
}
