"use client";

import { useState } from "react";

interface Aufgabe {
  id: string;
  title: string;
  description: string;
  location: string;
  done: boolean;
  assignee: string | null;
}

const mockAufgaben: Aufgabe[] = [
  {
    id: "1",
    title: "Laub auf Wegen entfernen",
    description: "Hauptweg und Zufahrt",
    location: "Aussenbereich",
    done: false,
    assignee: null,
  },
  {
    id: "2",
    title: "Waschkueche reinigen",
    description: "Boden wischen, Maschinen abwischen",
    location: "UG",
    done: false,
    assignee: "Alain",
  },
  {
    id: "3",
    title: "Aprikosenbaum schneiden",
    description: "Tote Aeste entfernen",
    location: "Garten Sued",
    done: false,
    assignee: null,
  },
  {
    id: "4",
    title: "Treppenhaus 1. OG reinigen",
    description: "Staubsaugen und wischen",
    location: "1. OG",
    done: true,
    assignee: "Yves",
  },
  {
    id: "5",
    title: "Sauna reinigen",
    description: "Holz abschleifen, Boden wischen",
    location: "Sauna",
    done: false,
    assignee: null,
  },
];

type Filter = "offen" | "erledigt" | "alle";

export default function AufgabenPage() {
  const [filter, setFilter] = useState<Filter>("offen");
  const [aufgaben, setAufgaben] = useState(mockAufgaben);

  const filtered = aufgaben.filter((a) => {
    if (filter === "offen") return !a.done;
    if (filter === "erledigt") return a.done;
    return true;
  });

  function toggleDone(id: string) {
    setAufgaben((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-4 font-mono text-2xl font-bold text-accent">
        Aufgaben
      </h1>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(["offen", "erledigt", "alle"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-mono text-xs capitalize transition-colors ${
              filter === f
                ? "bg-accent text-dark"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 ${
              a.done ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleDone(a.id)}
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  a.done
                    ? "border-accent bg-accent text-dark"
                    : "border-gray-600 hover:border-accent"
                }`}
              >
                {a.done && "✓"}
              </button>
              <div className="flex-1">
                <h3
                  className={`font-medium ${a.done ? "text-gray-500 line-through" : "text-white"}`}
                >
                  {a.title}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{a.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                  <span>{a.location}</span>
                  {a.assignee && (
                    <span className="text-accent">→ {a.assignee}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Aufgaben in dieser Ansicht.
        </p>
      )}
    </div>
  );
}
