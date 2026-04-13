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
  completedAt: string | null;
  activeWorkers: string[];
}

const CURRENT_USER = "Alain";

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
    completedAt: null,
    activeWorkers: [],
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
    completedAt: null,
    activeWorkers: ["Sophie"],
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
    completedAt: null,
    activeWorkers: [],
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
    completedAt: "2026-04-03",
    activeWorkers: [],
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
    completedAt: null,
    activeWorkers: [],
  },
  {
    id: "6",
    title: "Velokeller aufräumen",
    description: "Ungenutzte Velos aussortieren",
    location: "UG",
    done: true,
    assignee: "Marco",
    pin: null,
    createdBy: "Marco",
    createdAt: "2026-03-20",
    completedAt: "2026-03-22",
    activeWorkers: [],
  },
  {
    id: "7",
    title: "Briefkasten reparieren",
    description: "Klappe hängt durch",
    location: "Eingang",
    done: true,
    assignee: "Alain",
    pin: null,
    createdBy: "Nina",
    createdAt: "2026-03-15",
    completedAt: "2026-03-18",
    activeWorkers: [],
  },
  {
    id: "8",
    title: "Kräuterbeet jäten",
    description: "Unkraut entfernen",
    location: "Garten",
    done: true,
    assignee: "Ruth",
    pin: null,
    createdBy: "Ruth",
    createdAt: "2026-03-10",
    completedAt: "2026-03-11",
    activeWorkers: [],
  },
];

type Filter = "offen" | "erledigt" | "alle";

function daysBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round(
      (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
    )
  );
}

function formatDuration(days: number): string {
  if (days < 1) return "< 1 Tag";
  if (days === 1) return "1 Tag";
  if (days < 7) return `${days} Tage`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 Woche" : `${weeks} Wochen`;
}

function GelaendeMap({
  aufgaben,
  placingPin,
  pendingPin,
  selectedId,
  onPlacePin,
  onMovePin,
}: {
  aufgaben: Aufgabe[];
  placingPin: boolean;
  pendingPin: Pin | null;
  selectedId: string | null;
  onPlacePin: (pin: Pin) => void;
  onMovePin: (pin: Pin) => void;
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
      } else if (e.data?.type === "pinMoved") {
        onMovePin({ lat: e.data.lat, lng: e.data.lng });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [placingPin, onPlacePin, onMovePin]);

  // Pins an iframe senden
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "setPins",
        pins: openPins.map((a) => ({
          id: a.id,
          lat: a.pin!.lat,
          lng: a.pin!.lng,
          title: a.title,
        })),
      },
      "*"
    );
  }, [mapReady, openPins]);

  // Selected pin an iframe senden
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "setSelectedPin", id: selectedId },
      "*"
    );
  }, [mapReady, selectedId]);

  // Pending pin an iframe senden
  useEffect(() => {
    if (!mapReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "setPendingPin", pin: pendingPin },
      "*"
    );
  }, [mapReady, pendingPin]);

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
      {pendingPin && !placingPin && (
        <div className="bg-emerald-500/10 px-3 py-1.5 text-center text-xs text-emerald-300">
          📍 Pin gesetzt — Pin auf der Karte verschieben zum Anpassen
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Edit-Modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const filtered = aufgaben.filter((a) => {
    if (filter === "offen") return !a.done;
    if (filter === "erledigt") return a.done;
    return true;
  });

  // Durchschnittliche Erledigungsdauer
  const completedWithTime = aufgaben.filter(
    (a) => a.done && a.completedAt && a.createdAt
  );
  const avgDays =
    completedWithTime.length > 0
      ? completedWithTime.reduce(
          (sum, a) => sum + daysBetween(a.createdAt, a.completedAt!),
          0
        ) / completedWithTime.length
      : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function toggleDone(id: string) {
    const today = new Date().toISOString().split("T")[0]!;
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              done: !a.done,
              completedAt: !a.done ? today : null,
              activeWorkers: !a.done ? [] : a.activeWorkers,
            }
          : a
      )
    );
  }

  function startWorking(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === id && !a.activeWorkers.includes(CURRENT_USER)
          ? { ...a, activeWorkers: [...a.activeWorkers, CURRENT_USER] }
          : a
      )
    );
    showToast(
      `🔔 Push gesendet: ${CURRENT_USER} macht jetzt "${task.title}"`
    );
  }

  function joinWorking(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === id && !a.activeWorkers.includes(CURRENT_USER)
          ? { ...a, activeWorkers: [...a.activeWorkers, CURRENT_USER] }
          : a
      )
    );
    showToast(
      `🤝 Du hilfst jetzt bei "${task.title}" mit`
    );
  }

  function leaveWorking(id: string) {
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              activeWorkers: a.activeWorkers.filter((n) => n !== CURRENT_USER),
            }
          : a
      )
    );
  }

  function openEdit(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    setEditingId(id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditLocation(task.location);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === editingId
          ? {
              ...a,
              title: editTitle,
              description: editDesc,
              location: editLocation,
            }
          : a
      )
    );
    setEditingId(null);
  }

  function deleteAufgabe(id: string) {
    setAufgaben((prev) => prev.filter((a) => a.id !== id));
    setEditingId(null);
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
        createdBy: CURRENT_USER,
        createdAt: new Date().toISOString().split("T")[0]!,
        completedAt: null,
        activeWorkers: [],
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
      <TabHeader icon="/icon-aufgaben.webp" color="yellow" showIcon={false} />
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-aufgaben.webp"
          alt=""
          className="tab-btn-icon glow-yellow"
          loading="eager"
          fetchPriority="high"
        />
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full border border-yellow-400/50 bg-yellow-400/15 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-yellow-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-yellow-400/25"
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* Karte */}
      <GelaendeMap
        aufgaben={aufgaben}
        placingPin={placingPin}
        pendingPin={showCreate ? pendingPin : null}
        selectedId={selectedId}
        onPlacePin={(pin) => {
          setPendingPin(pin);
          setPlacingPin(false);
        }}
        onMovePin={(pin) => setPendingPin(pin)}
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

      {/* Stats */}
      {avgDays !== null && (
        <div className="mb-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[9px] font-bold uppercase tracking-widest text-yellow-400">
                ⏱ Ø Erledigungsdauer
              </p>
              <p className="mt-0.5 font-mono text-sm text-white">
                {formatDuration(Math.round(avgDays))}
              </p>
            </div>
            <p className="text-right font-mono text-[10px] text-gray-500">
              aus {completedWithTime.length} erledigten
              <br />
              Aufgaben
            </p>
          </div>
        </div>
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
        {filtered.map((a) => {
          const isSelected = selectedId === a.id;
          return (
            <div
              key={a.id}
              onClick={() => {
                if (!a.pin) return;
                setSelectedId(isSelected ? null : a.id);
              }}
              className={`relative cursor-pointer rounded-lg border p-3 transition-colors ${
                a.done ? "opacity-50" : ""
              } ${
                isSelected
                  ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                  : "border-gray-800 bg-white/5 hover:border-gray-700"
              }`}
            >
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(a.id);
                }}
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-[10px] text-gray-600 hover:bg-white/10 hover:text-yellow-300"
                aria-label="Aufgabe bearbeiten"
              >
                ✎
              </button>
              <div className="flex items-start gap-2 pr-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDone(a.id);
                  }}
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
                    {a.pin && (
                      <span
                        className={
                          isSelected ? "text-yellow-300" : "text-yellow-400"
                        }
                      >
                        📍
                      </span>
                    )}
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

              {/* Active workers / "Ich mache das" */}
              {!a.done && (
                <div className="mt-2 border-t border-gray-800 pt-2">
                  {a.activeWorkers.length === 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startWorking(a.id);
                      }}
                      className="w-full rounded-full bg-yellow-400/15 py-1 text-[9px] font-bold uppercase tracking-wider text-yellow-300 hover:bg-yellow-400/25"
                    >
                      🏃 Ich mache mich an die Aufgabe
                    </button>
                  ) : (
                    <>
                      <p className="mb-1 flex items-center gap-1 text-[9px] text-yellow-300">
                        <span>🏃</span>
                        <span className="truncate">
                          {a.activeWorkers.join(", ")}
                          {a.activeWorkers.length === 1
                            ? " ist dabei"
                            : " sind dabei"}
                        </span>
                      </p>
                      {a.activeWorkers.includes(CURRENT_USER) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            leaveWorking(a.id);
                          }}
                          className="w-full rounded-full border border-gray-700 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:border-gray-600 hover:text-white"
                        >
                          Aussteigen
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            joinWorking(a.id);
                          }}
                          className="w-full rounded-full bg-yellow-400 py-1 text-[9px] font-bold uppercase tracking-wider text-black hover:brightness-110"
                        >
                          + Joinen
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setEditingId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-black sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={saveEdit} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-yellow-300">
                  Aufgabe bearbeiten
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-gray-500 hover:text-white"
                  aria-label="Schliessen"
                >
                  ×
                </button>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-400">Titel</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs text-gray-400">Ort</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-yellow-400 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-110"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Diese Aufgabe wirklich löschen?")) {
                      deleteAufgabe(editingId);
                    }
                  }}
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                >
                  Löschen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[80] max-w-[92%] -translate-x-1/2 rounded-full border border-yellow-400/40 bg-black/90 px-4 py-2 text-xs text-yellow-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] backdrop-blur-sm">
          {toast}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Aufgaben in dieser Ansicht.
        </p>
      )}
    </div>
  );
}
