"use client";

import { useState } from "react";

interface Pin {
  x: number; // 0-100 percent on map
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
    pin: { x: 25, y: 70 },
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
    pin: { x: 65, y: 85 },
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
    pin: { x: 80, y: 45 },
  },
];

type Filter = "offen" | "erledigt" | "alle";

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

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!placingPin) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlacePin({ x, y });
  }

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-800">
      <svg
        viewBox="0 0 400 250"
        className={`w-full ${placingPin ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
      >
        {/* Hintergrund */}
        <rect width="400" height="250" fill="#0f1a08" />

        {/* Gelände-Umriss */}
        <path
          d="M50,30 L350,30 L380,60 L380,220 L300,230 L50,230 L20,200 L20,60 Z"
          fill="#141e0a"
          stroke="#2a3a1a"
          strokeWidth="1"
        />

        {/* Hauptgebäude (Dreieck/Keil) */}
        <path
          d="M120,70 L280,70 L300,90 L300,170 L200,180 L100,170 L100,90 Z"
          fill="#1a2a10"
          stroke="#3a5a20"
          strokeWidth="1.5"
        />

        {/* Glaspyramide Mitte */}
        <polygon
          points="200,90 220,130 200,170 180,130"
          fill="#1e3012"
          stroke="#4a6a30"
          strokeWidth="1"
        />

        {/* Nord-Flügel (links) */}
        <rect x="110" y="80" width="80" height="80" rx="3" fill="#162210" stroke="#3a5a20" strokeWidth="1" />
        <text x="150" y="125" textAnchor="middle" fill="#3a5a20" fontSize="8" fontFamily="Orbitron">NORD</text>

        {/* Ost-Flügel (rechts) */}
        <rect x="210" y="80" width="80" height="80" rx="3" fill="#162210" stroke="#3a5a20" strokeWidth="1" />
        <text x="250" y="125" textAnchor="middle" fill="#3a5a20" fontSize="8" fontFamily="Orbitron">OST</text>

        {/* Sauna */}
        <rect x="320" y="100" width="40" height="30" rx="3" fill="#1a1a0a" stroke="#5a5a20" strokeWidth="1" />
        <text x="340" y="119" textAnchor="middle" fill="#5a5a20" fontSize="6" fontFamily="Orbitron">SAUNA</text>

        {/* Garten Süd */}
        <ellipse cx="200" cy="210" rx="80" ry="20" fill="#0f1a08" stroke="#2a3a1a" strokeWidth="0.5" strokeDasharray="3,3" />
        <text x="200" y="214" textAnchor="middle" fill="#2a3a1a" fontSize="7" fontFamily="Orbitron">GARTEN</text>

        {/* Wege */}
        <path d="M60,130 L110,130" stroke="#2a3a1a" strokeWidth="2" strokeDasharray="4,3" />
        <path d="M290,130 L340,130" stroke="#2a3a1a" strokeWidth="2" strokeDasharray="4,3" />
        <path d="M200,180 L200,230" stroke="#2a3a1a" strokeWidth="2" strokeDasharray="4,3" />

        {/* Gästewohnwagen */}
        <rect x="30" y="180" width="50" height="25" rx="5" fill="#1a1a0a" stroke="#5a5a20" strokeWidth="1" />
        <text x="55" y="196" textAnchor="middle" fill="#5a5a20" fontSize="5" fontFamily="Orbitron">GÄSTI</text>

        {/* Aufgaben-Pins */}
        {openPins.map((a) => (
          <g key={a.id} transform={`translate(${a.pin!.x * 4}, ${a.pin!.y * 2.5})`}>
            <circle r="8" fill="#ff6b2b" opacity="0.3" />
            <circle r="4" fill="#ff6b2b" />
            <circle r="1.5" fill="white" />
          </g>
        ))}

        {/* Placing-Hint */}
        {placingPin && (
          <text x="200" y="20" textAnchor="middle" fill="#b8f068" fontSize="9" fontFamily="Inter">
            Tippe auf die Karte um den Pin zu setzen
          </text>
        )}
      </svg>
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold uppercase text-accent">
          AUFGABEN
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

          {/* Pin setzen */}
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
