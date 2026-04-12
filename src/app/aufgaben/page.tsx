"use client";

import { useState, useEffect, useRef } from "react";
import { TabHeader } from "@/components/TabHeader";

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
  createdBy: string;
  createdAt: string;
}

const mockAufgaben: Aufgabe[] = [
  {
    id: "1",
    title: "Laub auf Wegen entfernen",
    description: "Hauptweg und Zufahrt",
    location: "Aussenbereich",
    done: false,
    assignee: null,
    pin: { lat: 46.9697, lng: 7.441 },
    createdBy: "Marco",
    createdAt: "2026-04-08",
  },
  {
    id: "2",
    title: "Waschküche reinigen",
    description: "Boden wischen, Maschinen abwischen",
    location: "UG",
    done: false,
    assignee: "Alain",
    pin: null,
    createdBy: "Lena",
    createdAt: "2026-04-09",
  },
  {
    id: "3",
    title: "Aprikosenbaum schneiden",
    description: "Tote Äste entfernen",
    location: "Garten Süd",
    done: false,
    assignee: null,
    pin: { lat: 46.9691, lng: 7.4415 },
    createdBy: "Sven",
    createdAt: "2026-04-05",
  },
  {
    id: "4",
    title: "Treppenhaus 1. OG reinigen",
    description: "Staubsaugen und wischen",
    location: "1. OG",
    done: true,
    assignee: "Yves",
    pin: null,
    createdBy: "Lena",
    createdAt: "2026-04-01",
  },
  {
    id: "5",
    title: "Sauna reinigen",
    description: "Holz abschleifen, Boden wischen",
    location: "Sauna",
    done: false,
    assignee: null,
    pin: { lat: 46.9693, lng: 7.4419 },
    createdBy: "Felix",
    createdAt: "2026-04-07",
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const openPins = aufgaben.filter((a) => !a.done && a.pin);

  // Empfange Nachrichten vom iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "mapReady") {
        setMapReady(true);
      } else if (e.data?.type === "mapClick" && placingPin) {
        onPlacePin({ lat: e.data.lat, lng: e.data.lng });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [placingPin, onPlacePin]);

  // Pins an iframe senden
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "setPins",
        pins: openPins.map((a) => ({
          lat: a.pin!.lat,
          lng: a.pin!.lng,
          title: a.title,
        })),
      },
      "*"
    );
  }, [mapReady, openPins]);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-800">
      <iframe
        ref={iframeRef}
        src="/satellite-map.html"
        className="h-56 w-full border-0"
        title="Gelände Spinnereiweg 17"
      />
      {placingPin && (
        <div className="bg-yellow-400/10 px-3 py-1.5 text-center text-xs text-yellow-300">
          Tippe auf die Karte um den Pin zu setzen
        </div>
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
        createdBy: "Alain",
        createdAt: new Date().toISOString().split("T")[0]!,
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
    <div className="relative p-4 pb-20">
      <TabHeader icon="/icon-aufgaben.webp" color="yellow" />
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-yellow-400 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-black"
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* Karte */}
      <GelaendeMap
        aufgaben={aufgaben}
        placingPin={placingPin}
        onPlacePin={(pin) => {
          setPendingPin(pin);
          setPlacingPin(false);
        }}
      />

      {/* Erstellen */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Titel</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Was muss gemacht werden?"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
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
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Ort</label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="z.B. Garten Süd, UG..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setPlacingPin(!placingPin)}
              className={`w-full rounded-lg py-2 font-mono text-xs font-bold transition-colors ${
                placingPin
                  ? "bg-yellow-500 text-black"
                  : pendingPin
                    ? "border border-yellow-400 bg-yellow-500/10 text-yellow-300"
                    : "border border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {placingPin
                ? "📍 Tippe auf die Karte..."
                : pendingPin
                  ? "📍 Pin gesetzt — neu wählen"
                  : "📍 Pin auf Karte setzen"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-yellow-400 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-black"
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
      <div className="mb-4 flex justify-center gap-2">
        {(["offen", "erledigt", "alle"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider transition-colors ${
              filter === f
                ? "bg-yellow-400 text-black"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Liste — 2 Spalten */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border border-gray-800 bg-black/20 p-3 ${
              a.done ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => toggleDone(a.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                  a.done
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-gray-600 hover:border-yellow-400"
                }`}
              >
                {a.done && "✓"}
              </button>
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-xs font-medium leading-tight ${
                    a.done ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {a.title}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
                  {a.description}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-gray-600">
                  {a.pin && <span className="text-yellow-400">📍</span>}
                  <span className="truncate">{a.location}</span>
                </div>
                <p className="mt-1 text-[9px] text-gray-600">
                  {a.createdBy} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {a.assignee && (
                  <p className="mt-0.5 text-[9px] text-yellow-400">
                    → {a.assignee}
                  </p>
                )}
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
