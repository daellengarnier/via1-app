"use client";

import { useState } from "react";

interface Pin {
  x: number;
  y: number;
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

const mockAufgaben: Aufgabe[] = [
  {
    id: "1",
    title: "Laub auf Wegen entfernen",
    description: "Hauptweg und Zufahrt",
    location: "Aussenbereich",
    done: false,
    assignee: null,
    pin: { x: 30, y: 75 },
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
    pin: { x: 60, y: 85 },
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
    pin: { x: 78, y: 42 },
  },
];

type Filter = "offen" | "erledigt" | "alle";

// Spinnereiweg 17 Gelände-Karte (OpenStreetMap Embed — frei zoombar, kein API-Key)
const OSM_EMBED = "https://www.openstreetmap.org/export/embed.html?bbox=7.4275%2C46.9625%2C7.4315%2C46.9645&layer=mapnik";

function GelaendeMap({
  aufgaben,
  placingPin,
  onPlacePin,
}: {
  aufgaben: Aufgabe[];
  placingPin: boolean;
  onPlacePin: (pin: Pin) => void;
}) {
  const openPins = aufgaben.filter((a) => !a.done && a.pin);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placingPin) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlacePin({ x, y });
  }

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-800">
      <div className="relative h-56 w-full">
        {/* OpenStreetMap iframe — zoombar, verschiebbar */}
        <iframe
          src={OSM_EMBED}
          className="h-full w-full border-0"
          style={{ filter: "invert(90%) hue-rotate(180deg) saturate(0.3)" }}
          title="Gelände Spinnereiweg 17"
        />

        {/* Pin-Overlay (über der Karte) */}
        <div
          className={`absolute inset-0 ${placingPin ? "cursor-crosshair" : "pointer-events-none"}`}
          onClick={handleClick}
        >
          {/* Pins mit Beschriftung */}
          {openPins.map((a) => (
            <div
              key={a.id}
              className="pointer-events-none absolute"
              style={{
                left: `${a.pin!.x}%`,
                top: `${a.pin!.y}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex flex-col items-center">
                <div className="max-w-[130px] truncate rounded bg-secondary/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  {a.title}
                </div>
                <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-secondary/90" />
                <div className="mt-[-2px] h-2.5 w-2.5 rounded-full border border-white bg-secondary shadow-lg" />
              </div>
            </div>
          ))}

          {placingPin && (
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-accent/90 px-3 py-1 text-xs font-bold text-dark shadow-lg">
                Tippe auf die Karte um den Pin zu setzen
              </span>
            </div>
          )}
        </div>
      </div>
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
  const [placingPin, setPlacingPin] = useState(false);

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
    setPlacingPin(false);
    setShowCreate(false);
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between pr-12">
        <h1 className="text-2xl font-bold text-white">
          Aufgaben
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-dark"
        >
          + NEU
        </button>
      </div>

      {/* Gelände-Karte */}
      <GelaendeMap
        aufgaben={aufgaben}
        placingPin={placingPin}
        onPlacePin={(pin) => {
          setPendingPin(pin);
          setPlacingPin(false);
        }}
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
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setPlacingPin(!placingPin)}
              className={`w-full rounded-lg py-2 font-mono text-xs font-bold transition-colors ${
                placingPin
                  ? "bg-secondary text-white"
                  : pendingPin
                    ? "border border-accent bg-accent/10 text-accent"
                    : "border border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {placingPin
                ? "📍 Tippe auf die Karte oben..."
                : pendingPin
                  ? "📍 Pin gesetzt — nochmal klicken zum Ändern"
                  : "📍 Pin auf Karte setzen (optional)"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-dark"
            >
              ERSTELLEN
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setPendingPin(null);
                setPlacingPin(false);
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
            className={`rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider transition-colors ${
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
                  {a.pin && <span className="text-secondary">📍</span>}
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
