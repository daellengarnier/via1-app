"use client";

import { useState, useEffect, useRef } from "react";

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

// Spinnereiweg 17, 3004 Bern
const MAP_CENTER: [number, number] = [46.9635, 7.4295];
const MAP_ZOOM = 19;

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
    pin: { lat: 46.9632, lng: 7.4298 },
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
    pin: { lat: 46.9634, lng: 7.4289 },
  },
];

type Filter = "offen" | "erledigt" | "alle";

// Leaflet-Karte als eigene Komponente (dynamisch geladen wegen SSR)
function LeafletMap({
  aufgaben,
  placingPin,
  onPlacePin,
}: {
  aufgaben: Aufgabe[];
  placingPin: boolean;
  onPlacePin: (pin: Pin) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [loaded, setLoaded] = useState(false);

  const openPins = aufgaben.filter((a) => !a.done && a.pin);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamisch Leaflet laden (SSR-safe)
    Promise.all([
      import("leaflet"),
    ]).then(([L]) => {
      const map = L.map(mapRef.current!, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: true,
        attributionControl: false,
      });

      // Esri Satellitenbild
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 22 }
      ).addTo(map);

      // Strassen-Labels als Overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 22, opacity: 0.6 }
      ).addTo(map);

      mapInstanceRef.current = map;
      setLoaded(true);

      // Click-Handler für Pin-Setzen
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (placingPin) {
          onPlacePin({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as L.Map).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click-Handler updaten wenn placingPin sich ändert
  useEffect(() => {
    const map = mapInstanceRef.current as L.Map | null;
    if (!map) return;

    map.off("click");
    if (placingPin) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onPlacePin({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
  }, [placingPin, onPlacePin]);

  // Marker updaten
  useEffect(() => {
    if (!loaded) return;
    const L = require("leaflet") as typeof import("leaflet");
    const map = mapInstanceRef.current as L.Map;

    // Alte Marker entfernen
    markersRef.current.forEach((m) => (m as L.Marker).remove());
    markersRef.current = [];

    // Neue Marker setzen
    openPins.forEach((a) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-100%)">
          <div style="background:rgba(255,107,43,0.9);color:white;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.5)">${a.title}</div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid rgba(255,107,43,0.9)"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#ff6b2b;border:1.5px solid white;margin-top:-2px;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([a.pin!.lat, a.pin!.lng], { icon }).addTo(map);
      markersRef.current.push(marker);
    });
  }, [openPins, loaded]);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-800">
      <div ref={mapRef} className="h-56 w-full" />
      {placingPin && (
        <div className="bg-accent/10 px-3 py-1.5 text-center text-xs text-accent">
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
        <h1 className="text-2xl font-bold text-white">Aufgaben</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-dark"
        >
          + NEU
        </button>
      </div>

      {/* Satellitenkarte */}
      <LeafletMap
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
            <label className="mb-1 block text-xs text-gray-400">Beschreibung</label>
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
