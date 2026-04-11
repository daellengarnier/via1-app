"use client";

import { useState } from "react";

interface Inserat {
  id: string;
  title: string;
  description: string;
  image: string | null;
  createdBy: string;
  createdAt: string;
  takenBy: string | null;
  takenAt: string | null;
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

  // Inserate die noch sichtbar sind: nicht genommen ODER genommen vor weniger als 2 Tagen
  const visible = inserate.filter((ins) => {
    if (!ins.takenAt) return true;
    return daysBetween(ins.takenAt, today) < 2;
  });

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

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between pr-12">
        <h1 className="font-display text-2xl font-bold uppercase text-accent">
          FLOHMI
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-dark"
        >
          + INSERIEREN
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Kleider & Dinge, die ein neues Zuhause suchen
      </p>

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

      {/* Inserate */}
      <div className="space-y-3">
        {visible.map((ins) => {
          const isTaken = ins.takenBy !== null;
          return (
            <div
              key={ins.id}
              className={`rounded-lg border bg-gradient-to-br from-gray-900/80 to-gray-900/40 ${
                isTaken
                  ? "border-accent/30 opacity-60"
                  : "border-gray-800"
              }`}
            >
              {ins.image && (
                <img
                  src={ins.image}
                  alt={ins.title}
                  className="h-40 w-full rounded-t-lg object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className={`font-medium ${isTaken ? "text-gray-500 line-through" : "text-white"}`}
                    >
                      {ins.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {ins.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    von {ins.createdBy} ·{" "}
                    {new Date(ins.createdAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {isTaken ? (
                    <span className="font-mono text-xs text-accent">
                      ✓ Genommen von {ins.takenBy}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTake(ins.id)}
                      className="rounded-full bg-accent px-3 py-1 font-mono text-xs font-bold text-dark"
                    >
                      Nehme ich!
                    </button>
                  )}
                </div>
                {isTaken && ins.takenAt && (
                  <p className="mt-1 text-xs text-gray-600">
                    Verschwindet automatisch in{" "}
                    {2 - daysBetween(ins.takenAt, today)} Tag(en)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Keine Inserate vorhanden. Hast du etwas zum Weggeben?
        </p>
      )}
    </div>
  );
}
