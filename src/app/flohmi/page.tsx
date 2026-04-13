"use client";

import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Inserat {
  id: string;
  title: string;
  description: string;
  image: string | null;
  createdBy: string;
  createdAt: string;
  takenBy: string | null;
  takenAt: string | null;
  comments: Comment[];
}

const mockInserate: Inserat[] = [
  {
    id: "1",
    title: "Winterjacke Gr. M",
    description: "Blau, kaum getragen. Steht im Treppenhaus EG Nord.",
    image: null,
    createdBy: "Sophie",
    createdAt: "2026-04-08",
    takenBy: null,
    takenAt: null,
    comments: [
      {
        id: "c1",
        author: "Lena",
        text: "Ist sie wirklich warm genug für -10°C?",
        date: "2026-04-09",
      },
      {
        id: "c2",
        author: "Sophie",
        text: "Ja, absolut! Hatte sie letzten Winter an.",
        date: "2026-04-09",
      },
    ],
  },
  {
    id: "2",
    title: "Bücherregal IKEA Billy",
    description: "Weiss, guter Zustand. Muss selber abgeholt werden, 1. OG Ost.",
    image: null,
    createdBy: "Jan",
    createdAt: "2026-04-07",
    takenBy: null,
    takenAt: null,
    comments: [],
  },
  {
    id: "3",
    title: "Laufschuhe Gr. 42",
    description: "Nike, leicht abgenutzt.",
    image: null,
    createdBy: "Felix",
    createdAt: "2026-04-05",
    takenBy: "Dario",
    takenAt: "2026-04-09",
    comments: [],
  },
];

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function FlohmiPage() {
  const today = new Date().toISOString().split("T")[0]!;
  const [inserate, setInserate] = useState(mockInserate);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);

  // Detail-Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  // Inserate die noch sichtbar sind
  const visible = inserate.filter((ins) => {
    if (!ins.takenAt) return true;
    return daysBetween(ins.takenAt, today) < 2;
  });

  const selected = selectedId
    ? inserate.find((i) => i.id === selectedId) ?? null
    : null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setInserate((prev) => [
      {
        id: String(Date.now()),
        title: newTitle,
        description: newDesc,
        image: newImage,
        createdBy: "Alain",
        createdAt: today,
        takenBy: null,
        takenAt: null,
        comments: [],
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewDesc("");
    setNewImage(null);
    setShowCreate(false);
  }

  function handleTake(id: string) {
    setInserate((prev) =>
      prev.map((ins) =>
        ins.id === id
          ? { ...ins, takenBy: "Alain", takenAt: today }
          : ins
      )
    );
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !selectedId) return;
    setInserate((prev) =>
      prev.map((ins) =>
        ins.id === selectedId
          ? {
              ...ins,
              comments: [
                ...ins.comments,
                {
                  id: String(Date.now()),
                  author: "Alain",
                  text: newComment,
                  date: today,
                },
              ],
            }
          : ins
      )
    );
    setNewComment("");
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">Flohmi</h1>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
        >
          + Neues Inserat
        </button>
      </div>

      {/* Erstellen */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Was gibst du weg?
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Pulli, Schuhe, Regal..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Beschreibung
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Grösse, Zustand, Abholort..."
              rows={2}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Foto</label>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900 p-4 text-sm text-gray-500 transition-colors hover:border-accent hover:text-accent">
              {newImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={newImage}
                  alt="Vorschau"
                  className="h-32 rounded object-cover"
                />
              ) : (
                <span>Foto hochladen</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Inserieren
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewImage(null);
              }}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Inserate — 2 Spalten */}
      <div className="grid grid-cols-2 gap-3">
        {visible.map((ins) => {
          const isTaken = ins.takenBy !== null;
          return (
            <button
              key={ins.id}
              onClick={() => setSelectedId(ins.id)}
              className={`flex flex-col overflow-hidden rounded-lg border text-left ${
                isTaken
                  ? "border-accent/30 opacity-60"
                  : "border-gray-800 hover:border-gray-700"
              } bg-white/5`}
            >
              {ins.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ins.image}
                  alt={ins.title}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-gray-900/40 text-3xl opacity-40">
                  📦
                </div>
              )}
              <div className="flex flex-1 flex-col p-2.5">
                <h3
                  className={`truncate text-xs font-medium ${
                    isTaken ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {ins.title}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
                  {ins.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-[9px] text-gray-600">
                    {ins.createdBy}
                  </span>
                  {ins.comments.length > 0 && (
                    <span className="text-[9px] text-gray-500">
                      💬 {ins.comments.length}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Inserate vorhanden. Hast du etwas zum Weggeben?
        </p>
      )}

      {/* Detail-Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-800 bg-black sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.image}
                alt={selected.title}
                className="max-h-[50vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-gray-900/40 text-5xl opacity-40">
                📦
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {selected.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-600">
                    von {selected.createdBy} ·{" "}
                    {new Date(selected.createdAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-gray-500 hover:text-white"
                  aria-label="Schliessen"
                >
                  ×
                </button>
              </div>

              {selected.takenBy ? (
                <p className="mt-3 text-sm text-accent">
                  ✓ Genommen von {selected.takenBy}
                </p>
              ) : (
                <button
                  onClick={() => {
                    handleTake(selected.id);
                  }}
                  className="mt-4 w-full rounded-full bg-accent py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
                >
                  Nehme ich!
                </button>
              )}

              {/* Kommentare */}
              <div className="mt-5 border-t border-gray-800 pt-4">
                <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  KOMMENTARE ({selected.comments.length})
                </p>
                <div className="space-y-2">
                  {selected.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded border-l-2 border-gray-700 bg-white/3 py-1.5 pl-2 pr-2"
                    >
                      <p className="text-xs text-gray-300">{c.text}</p>
                      <p className="mt-0.5 text-[9px] text-gray-600">
                        — {c.author}
                      </p>
                    </div>
                  ))}
                  {selected.comments.length === 0 && (
                    <p className="text-xs text-gray-600">
                      Noch keine Kommentare
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Frage oder Kommentar..."
                    className="flex-1 rounded border border-gray-800 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded bg-accent px-3 py-1.5 text-[10px] font-bold text-dark"
                  >
                    OK
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
