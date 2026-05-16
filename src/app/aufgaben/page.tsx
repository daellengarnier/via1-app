"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { TabHeader } from "@/components/TabHeader";
import { compressImage } from "@/lib/image-compress";
import { WaveDivider } from "@/components/WaveDivider";

interface Pin {
  lat: number;
  lng: number;
}

interface SubTodo {
  id: string;
  title: string;
  done: boolean;
  position: number;
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
  completedBy: string | null;
  activeWorkers: string[];
  subTodos: SubTodo[];
  images: string[];
}

// Aufgaben werden vom API geladen

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
  hideId,
  onPlacePin,
  onMovePin,
}: {
  aufgaben: Aufgabe[];
  placingPin: boolean;
  pendingPin: Pin | null;
  selectedId: string | null;
  hideId?: string | null;
  onPlacePin: (pin: Pin) => void;
  onMovePin: (pin: Pin) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const openPins = aufgaben.filter(
    (a) => !a.done && a.pin && a.id !== hideId
  );

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
    <div
      style={{ ["--tile-glow-rgb" as string]: "250, 204, 21" }}
      className="wg-glow-border mb-4 overflow-hidden rounded-lg border border-gray-800"
    >
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

export default function AufgabenPageWrapper() {
  return (
    <Suspense fallback={null}>
      <AufgabenPage />
    </Suspense>
  );
}

function AufgabenPage() {
  const { data: session } = useSession();
  const currentUserName = session?.user?.name ?? "";
  const [filter, setFilter] = useState<Filter>("offen");
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [pendingPin, setPendingPin] = useState<Pin | null>(null);
  const [placingPin, setPlacingPin] = useState(false);
  const [newCreateSubTodos, setNewCreateSubTodos] = useState<string[]>([]);
  const [newCreateSubTodoInput, setNewCreateSubTodoInput] = useState("");
  const [newCreateImages, setNewCreateImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Edit-Modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPin, setEditPin] = useState<Pin | null>(null);
  const [editPlacingPin, setEditPlacingPin] = useState(false);
  const [newSubTodo, setNewSubTodo] = useState("");

  const loadAufgaben = useCallback(async () => {
    try {
      const res = await fetch("/api/aufgaben");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Aufgabe[];
      setAufgaben(data);
      setLoadError(null);
    } catch (err) {
      console.error("Aufgaben laden", err);
      setLoadError("Aufgaben konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAufgaben();
  }, [loadAufgaben]);

  useEffect(() => {
    if (loading) return;
    const editId = searchParams?.get("edit");
    const focusId = searchParams?.get("focus");
    if (editId && aufgaben.some((a) => a.id === editId)) {
      openEdit(editId);
      router.replace("/aufgaben");
    } else if (focusId && aufgaben.some((a) => a.id === focusId)) {
      setSelectedId(focusId);
      router.replace("/aufgaben");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchParams]);

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

  function updateLocalAufgabe(updated: Aufgabe) {
    setAufgaben((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function toggleDone(id: string) {
    const current = aufgaben.find((a) => a.id === id);
    if (!current) return;
    try {
      const res = await fetch(`/api/aufgaben/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !current.done }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      updateLocalAufgabe(updated);
    } catch (err) {
      console.error("toggleDone", err);
      alert("Konnte Status nicht aendern.");
    }
  }

  async function startWorking(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    try {
      const res = await fetch(`/api/aufgaben/${id}/workers`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      updateLocalAufgabe(updated);
      showToast(
        `🔔 Push gesendet: ${currentUserName} packt "${task.title}" an`
      );
    } catch (err) {
      console.error("startWorking", err);
    }
  }

  async function joinWorking(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    try {
      const res = await fetch(`/api/aufgaben/${id}/workers`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      updateLocalAufgabe(updated);
      showToast(`🤝 Du hilfst jetzt bei "${task.title}" mit`);
    } catch (err) {
      console.error("joinWorking", err);
    }
  }

  async function leaveWorking(id: string) {
    try {
      const res = await fetch(`/api/aufgaben/${id}/workers`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      updateLocalAufgabe(updated);
    } catch (err) {
      console.error("leaveWorking", err);
    }
  }

  function openEdit(id: string) {
    const task = aufgaben.find((a) => a.id === id);
    if (!task) return;
    setEditingId(id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditLocation(task.location);
    setEditPin(task.pin);
    setEditPlacingPin(false);
    setEditImages(task.images);
  }

  function closeEdit() {
    setEditingId(null);
    setEditPlacingPin(false);
    setNewSubTodo("");
    setEditImages([]);
  }

  async function addSubTodo(aufgabeId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`/api/aufgaben/${aufgabeId}/subtodos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sub = (await res.json()) as SubTodo;
      setAufgaben((prev) =>
        prev.map((a) =>
          a.id === aufgabeId ? { ...a, subTodos: [...a.subTodos, sub] } : a
        )
      );
      setNewSubTodo("");
    } catch (err) {
      console.error("addSubTodo", err);
    }
  }

  async function toggleSubTodo(aufgabeId: string, sub: SubTodo) {
    // optimistic
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === aufgabeId
          ? {
              ...a,
              subTodos: a.subTodos.map((s) =>
                s.id === sub.id ? { ...s, done: !s.done } : s
              ),
            }
          : a
      )
    );
    try {
      await fetch(`/api/aufgaben/${aufgabeId}/subtodos/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !sub.done }),
      });
    } catch (err) {
      console.error("toggleSubTodo", err);
    }
  }

  async function deleteSubTodo(aufgabeId: string, subId: string) {
    setAufgaben((prev) =>
      prev.map((a) =>
        a.id === aufgabeId
          ? { ...a, subTodos: a.subTodos.filter((s) => s.id !== subId) }
          : a
      )
    );
    try {
      await fetch(`/api/aufgaben/${aufgabeId}/subtodos/${subId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("deleteSubTodo", err);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    try {
      const res = await fetch(`/api/aufgaben/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          location: editLocation,
          pin: editPin,
          images: editImages,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Aufgabe;
      updateLocalAufgabe(updated);
      closeEdit();
    } catch (err) {
      console.error("saveEdit", err);
      alert("Konnte Aenderungen nicht speichern.");
    }
  }

  async function deleteAufgabe(id: string) {
    try {
      const res = await fetch(`/api/aufgaben/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAufgaben((prev) => prev.filter((a) => a.id !== id));
      closeEdit();
    } catch (err) {
      console.error("deleteAufgabe", err);
      alert("Konnte nicht loeschen.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/aufgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          location: newLocation,
          pin: pendingPin,
          subTodos: newCreateSubTodos,
          images: newCreateImages,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Aufgabe;
      setAufgaben((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setNewLocation("");
      setPendingPin(null);
      setPlacingPin(false);
      setShowCreate(false);
      setNewCreateSubTodos([]);
      setNewCreateSubTodoInput("");
      setNewCreateImages([]);
    } catch (err) {
      console.error("handleCreate", err);
      alert("Konnte Aufgabe nicht erstellen.");
    }
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
        <WaveDivider color="yellow" variant={1} />
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
        placingPin={placingPin || editPlacingPin}
        pendingPin={
          editingId ? editPin : showCreate ? pendingPin : null
        }
        selectedId={selectedId}
        hideId={editingId}
        onPlacePin={(pin) => {
          if (editingId) {
            setEditPin(pin);
            setEditPlacingPin(false);
          } else {
            setPendingPin(pin);
            setPlacingPin(false);
          }
        }}
        onMovePin={(pin) => {
          if (editingId) setEditPin(pin);
          else setPendingPin(pin);
        }}
      />

      {/* Pin-Edit Banner (wenn editPlacingPin aktiv) */}
      {editPlacingPin && (
        <div className="mb-4 rounded-lg border border-yellow-400/60 bg-yellow-400/10 p-3 text-center">
          <p className="mb-2 text-xs text-yellow-200">
            📍 Tippe auf die Karte oder ziehe den Pin an die richtige Stelle.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setEditPlacingPin(false)}
              className="rounded-full bg-yellow-400 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black"
            >
              Fertig
            </button>
            <button
              onClick={() => {
                setEditPin(null);
                setEditPlacingPin(false);
              }}
              className="rounded-full border border-red-400/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300"
            >
              Pin entfernen
            </button>
          </div>
        </div>
      )}

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
            <label className="mb-1 block text-xs text-gray-400">
              Subtasks (optional)
            </label>
            {newCreateSubTodos.length > 0 && (
              <ul className="mb-2 space-y-1">
                {newCreateSubTodos.map((title, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded border border-gray-800/60 bg-black/20 px-2 py-1"
                  >
                    <span className="flex-1 text-xs text-white">{title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewCreateSubTodos((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-gray-500 hover:text-red-400"
                      aria-label="Entfernen"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCreateSubTodoInput}
                onChange={(e) => setNewCreateSubTodoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newCreateSubTodoInput.trim();
                    if (v) {
                      setNewCreateSubTodos((prev) => [...prev, v]);
                      setNewCreateSubTodoInput("");
                    }
                  }
                }}
                placeholder="Subtask hinzufügen…"
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const v = newCreateSubTodoInput.trim();
                  if (v) {
                    setNewCreateSubTodos((prev) => [...prev, v]);
                    setNewCreateSubTodoInput("");
                  }
                }}
                disabled={newCreateSubTodoInput.trim() === ""}
                className="rounded bg-yellow-400 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Fotos (optional, max. 8)
            </label>
            {newCreateImages.length > 0 && (
              <div className="mb-2 grid grid-cols-4 gap-2">
                {newCreateImages.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="h-16 w-full rounded border border-gray-800 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewCreateImages((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white hover:bg-red-500"
                      aria-label="Entfernen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label
              className={`block cursor-pointer rounded-lg border border-gray-700 py-2 text-center font-mono text-xs font-bold ${
                newCreateImages.length >= 8 || imageBusy
                  ? "opacity-40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {imageBusy
                ? "📷 wird verarbeitet..."
                : newCreateImages.length >= 8
                  ? "Maximum erreicht"
                  : "📷 Foto aufnehmen / hochladen"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={newCreateImages.length >= 8 || imageBusy}
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length === 0) return;
                  setImageBusy(true);
                  try {
                    const compressed = await Promise.all(
                      files.map((f) =>
                        compressImage(f, { maxSize: 1400, quality: 0.78 })
                      )
                    );
                    setNewCreateImages((prev) =>
                      [...prev, ...compressed].slice(0, 8)
                    );
                  } catch (err) {
                    console.error("image compress", err);
                  } finally {
                    setImageBusy(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
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
                setNewCreateSubTodos([]);
                setNewCreateSubTodoInput("");
                setNewCreateImages([]);
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
              onClick={() => router.push(`/aufgaben/${a.id}`)}
              style={{ ["--tile-glow-rgb" as string]: "250, 204, 21" }}
              className={`wg-glow-border relative cursor-pointer rounded-lg border p-3 transition-colors ${
                a.done ? "opacity-50" : ""
              } ${
                isSelected
                  ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                  : "border-gray-800 bg-white/10 hover:border-gray-700"
              }`}
            >
              {/* Edit + Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(a.id);
                }}
                className="absolute right-6 top-1.5 flex h-5 w-5 items-center justify-center rounded text-[10px] text-gray-600 hover:bg-white/10 hover:text-yellow-300"
                aria-label="Aufgabe bearbeiten"
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Diese Aufgabe wirklich löschen?")) {
                    deleteAufgabe(a.id);
                  }
                }}
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-[14px] leading-none text-gray-600 hover:bg-white/10 hover:text-red-400"
                aria-label="Aufgabe löschen"
              >
                ×
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
                    className={`font-display text-[11px] font-bold uppercase tracking-wider leading-tight ${
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
                    {a.images.length > 0 && (
                      <span title={`${a.images.length} Foto${a.images.length === 1 ? "" : "s"}`}>
                        📷{a.images.length > 1 && a.images.length}
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
                  {a.done && a.completedAt && (
                    <p className="mt-0.5 text-[9px] text-emerald-400/80">
                      ✓ erledigt
                      {a.completedBy ? ` von ${a.completedBy}` : ""}
                      {" · "}
                      {new Date(a.completedAt).toLocaleDateString("de-CH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {a.subTodos.length > 0 && (() => {
                    const doneCount = a.subTodos.filter((s) => s.done).length;
                    const total = a.subTodos.length;
                    const pct = total === 0 ? 0 : (doneCount / total) * 100;
                    return (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <span>📋 Subtasks</span>
                          <span>{doneCount}/{total}</span>
                        </div>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full bg-yellow-400/70 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
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
                      🏃 Ich packs an
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
                      {a.activeWorkers.includes(currentUserName) ? (
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

      {/* Lightbox fuer Fotos */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Foto"
            className="max-h-full max-w-full rounded object-contain"
          />
        </div>
      )}

      {/* Edit Modal (beim Pin-Platzieren versteckt) */}
      {editingId && !editPlacingPin && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={closeEdit}
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
                  onClick={closeEdit}
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
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-400">Ort</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* Subtasks-Section */}
              {editingId && (() => {
                const editingTask = aufgaben.find((a) => a.id === editingId);
                if (!editingTask) return null;
                return (
                  <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
                    <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                      📋 Subtasks
                    </p>
                    <p className="mb-3 text-[10px] text-gray-500">
                      Kleine Schritte, die helfen die Aufgabe richtig auszuführen.
                    </p>
                    <ul className="mb-3 space-y-1.5">
                      {editingTask.subTodos.map((s) => (
                        <li
                          key={s.id}
                          className="group flex items-center gap-2 rounded border border-gray-800/60 bg-black/20 px-2 py-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSubTodo(editingTask.id, s)}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                              s.done
                                ? "border-yellow-400 bg-yellow-400 text-black"
                                : "border-gray-600 hover:border-yellow-400"
                            }`}
                            aria-label={s.done ? "Erledigt" : "Offen"}
                          >
                            {s.done && "✓"}
                          </button>
                          <span
                            className={`flex-1 text-xs ${
                              s.done ? "text-gray-500 line-through" : "text-white"
                            }`}
                          >
                            {s.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteSubTodo(editingTask.id, s.id)}
                            className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-60"
                            aria-label="Subtask löschen"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      {editingTask.subTodos.length === 0 && (
                        <li className="text-[10px] italic text-gray-600">
                          Noch keine Subtasks.
                        </li>
                      )}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubTodo}
                        onChange={(e) => setNewSubTodo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubTodo(editingTask.id, newSubTodo);
                          }
                        }}
                        placeholder="Neuer Subtask…"
                        className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-yellow-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addSubTodo(editingTask.id, newSubTodo)}
                        disabled={newSubTodo.trim() === ""}
                        className="rounded bg-yellow-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Fotos */}
              <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
                <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                  📷 Fotos
                </p>
                {editImages.length > 0 && (
                  <div className="mb-2 grid grid-cols-4 gap-2">
                    {editImages.map((src, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Foto ${i + 1}`}
                          className="h-16 w-full rounded border border-gray-800 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditImages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white hover:bg-red-500"
                          aria-label="Entfernen"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label
                  className={`block cursor-pointer rounded-lg border border-gray-700 py-2 text-center font-mono text-xs font-bold ${
                    editImages.length >= 8 || imageBusy
                      ? "opacity-40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {imageBusy
                    ? "📷 wird verarbeitet..."
                    : editImages.length >= 8
                      ? "Maximum erreicht"
                      : "📷 Foto aufnehmen / hochladen"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    disabled={editImages.length >= 8 || imageBusy}
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length === 0) return;
                      setImageBusy(true);
                      try {
                        const compressed = await Promise.all(
                          files.map((f) =>
                            compressImage(f, { maxSize: 1400, quality: 0.78 })
                          )
                        );
                        setEditImages((prev) =>
                          [...prev, ...compressed].slice(0, 8)
                        );
                      } catch (err) {
                        console.error("image compress", err);
                      } finally {
                        setImageBusy(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>

              {/* Pin-Section */}
              <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
                <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                  Pin auf Karte
                </p>
                {editPin ? (
                  <div>
                    <p className="mb-2 font-mono text-[10px] text-gray-400">
                      📍 {editPin.lat.toFixed(5)}, {editPin.lng.toFixed(5)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPlacingPin(true)}
                        className="flex-1 rounded border border-yellow-400/50 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300 hover:bg-yellow-400/10"
                      >
                        Pin verschieben
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPin(null)}
                        className="rounded border border-red-500/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Standardposition setzen falls leer — Zentrum der Karte
                      setEditPin({ lat: 46.9695, lng: 7.4413 });
                      setEditPlacingPin(true);
                    }}
                    className="w-full rounded border border-gray-700 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:border-yellow-400 hover:text-yellow-300"
                  >
                    📍 Pin auf Karte setzen
                  </button>
                )}
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

      {loading && filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">Lade Aufgaben …</p>
      )}
      {!loading && loadError && (
        <p className="mt-8 text-center text-sm text-red-400">{loadError}</p>
      )}
      {!loading && !loadError && filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Aufgaben in dieser Ansicht.
        </p>
      )}
    </div>
  );
}
