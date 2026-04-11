"use client";

import { useState } from "react";

interface Pin {
  lat: number;
  lng: number;
}

interface Aufgabe {
  id: string;
  title: string;
  description: string;
  location: string;
  done: boolean;
  assignee: string | null;
  pin: Pin | null;
}

// Zentrum des Geländes: Spinnereiweg 17, 3004 Bern
const MAP_CENTER = { lat: 46.9635, lng: 7.4295 };

const mockAufgaben: Aufgabe[] = [
  {
    id: "1",
    title: "Laub auf Wegen entfernen",
    description: "Hauptweg und Zufahrt",
    location: "Aussenbereich",
    done: false,
    assignee: null,
    pin: { lat: 46.9637, lng: 7.4292 },
  },
  {
    id: "2",
    title: "Waschküche reinigen",
    description: "Boden wischen, Maschinen abwischen",
    location: "UG",
    done: false,
    assignee: "Alain",
    pin: null,
  },
  {
    id: "3",
    title: "Aprikosenbaum schneiden",
    description: "Tote Äste entfernen",
    location: "Garten Süd",
    done: false,
    assignee: null,
    pin: { lat: 46.9633, lng: 7.4298 },
  },
  {
    id: "4",
    title: "Treppenhaus 1. OG reinigen",
    description: "Staubsaugen und wischen",
    location: "1. OG",
    done: true,
    assignee: "Yves",
    pin: null,
  },
  {
    id: "5",
    title: "Sauna reinigen",
    description: "Holz abschleifen, Boden wischen",
    location: "Sauna",
    done: false,
    assignee: null,
    pin: { lat: 46.9632, lng: 7.4290 },
  },
];

type Filter = "offen" | "erledigt" | "alle";

function MapView({
  aufgaben,
  showCreate,
}: {
  aufgaben: Aufgabe[];
  showCreate: boolean;
}) {
  const openPins = aufgaben.filter((a) => !a.done && a.pin);

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-800">
      {/* Google Maps Embed */}
      <div className="relative h-48 w-full">
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d500!2d${MAP_CENTER.lng}!3d${MAP_CENTER.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478e39bf12aa tried2b%3A0x0!2sSpinnereiweg+17%2C+3004+Bern!5e1!3m2!1sde!2sch!4v1`}
          width="100%"
          height="100%"
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Gelände Spinnereiweg 17"
        />

        {/* Pin-Overlay */}
        <div className="pointer-events-none absolute inset-0">
          {openPins.map((a) => {
            // Einfache Projektion relativ zum Kartenzentrum
            const dx = (a.pin!.lng - MAP_CENTER.lng) * 50000;
            const dy = (MAP_CENTER.lat - a.pin!.lat) * 50000;
            const x = 50 + dx;
            const y = 50 + dy;
            if (x < 5 || x > 95 || y < 5 || y > 95) return null;
            return (
              <div
                key={a.id}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -100%)" }}
              >
                <div className="flex flex-col items-center">
                  <div className="rounded bg-secondary/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                    {a.title.slice(0, 15)}
                  </div>
                  <svg width="12" height="16" viewBox="0 0 12 16" className="text-secondary">
                    <path d="M6 0C2.7 0 0 2.7 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z" fill="currentColor" />
                    <circle cx="6" cy="6" r="2.5" fill="white" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <p className="bg-accent/10 px-3 py-1.5 text-center text-xs text-accent">
          Tippe auf die Karte um einen Pin zu setzen (optional)
        </p>
      )}
    </div>
  );
}

export default function AufgabenPage() {
  const [filter, setFilter] = useState<Filter>("offen");
  const [aufgaben, setAufgaben] = useState(mockAufgaben);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [pendingPin, setPendingPin] = useState<Pin | null>(null);

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

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAufgaben((prev) => [
      {
        id: String(Date.now()),
        title: newTitle,
        description: newDesc,
        location: newLocation,
        done: false,
        assignee: null,
        pin: pendingPin,
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewDesc("");
    setNewLocation("");
    setPendingPin(null);
    setShowCreate(false);
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-accent">
          Aufgaben
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-mono text-xs font-bold text-dark"
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* Karte */}
      <MapView
        aufgaben={aufgaben}
        showCreate={showCreate}
      />

      {/* Erstellen-Formular */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Titel</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Was muss gemacht werden?"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Beschreibung
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Details..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Ort</label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="z.B. Garten Süd, UG, Treppenhaus..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setPendingPin(null);
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
                  {a.pin && (
                    <span className="text-secondary">📍</span>
                  )}
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
