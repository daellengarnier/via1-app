"use client";

import { useState } from "react";

type TerminType = "haussitzung" | "hausessen" | "andere";

interface Sitzung {
  id: string;
  title: string;
  date: string;
  location: string;
  type: TerminType;
  agendaCount: number;
}

const mockSitzungen: Sitzung[] = [
  {
    id: "1",
    title: "Haussitzung April",
    date: "2026-04-16T19:30",
    location: "Gemeinschaftsraum EG",
    type: "haussitzung",
    agendaCount: 3,
  },
  {
    id: "2",
    title: "Hausessen Fruehling",
    date: "2026-04-25T18:00",
    location: "Innenhof",
    type: "hausessen",
    agendaCount: 0,
  },
  {
    id: "3",
    title: "Haussitzung Maerz",
    date: "2026-03-19T19:30",
    location: "Gemeinschaftsraum EG",
    type: "haussitzung",
    agendaCount: 5,
  },
];

const typeLabels: Record<TerminType, string> = {
  haussitzung: "Haussitzung",
  hausessen: "Hausessen",
  andere: "Andere",
};

const typeColors: Record<TerminType, string> = {
  haussitzung: "text-accent",
  hausessen: "text-secondary",
  andere: "text-gray-400",
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export default function TerminePage() {
  const [filter, setFilter] = useState<TerminType | "alle">("alle");

  const filtered =
    filter === "alle"
      ? mockSitzungen
      : mockSitzungen.filter((s) => s.type === filter);

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-4 font-mono text-2xl font-bold text-accent">
        Termine
      </h1>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(["alle", "haussitzung", "hausessen", "andere"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              filter === f
                ? "bg-accent text-dark"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {f === "alle" ? "Alle" : typeLabels[f]}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`font-mono text-xs uppercase ${typeColors[s.type]}`}
                >
                  {typeLabels[s.type]}
                </span>
                <h3 className="mt-1 text-lg font-medium text-white">
                  {s.title}
                </h3>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {formatDate(s.date)} · {formatTime(s.date)}
            </p>
            <p className="text-sm text-gray-500">{s.location}</p>
            {s.agendaCount > 0 && (
              <p className="mt-1 text-xs text-gray-600">
                {s.agendaCount} Traktanden
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
