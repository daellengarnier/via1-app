"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { compressImage } from "@/lib/image-compress";

interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  date: string;
}

interface Inserat {
  id: string;
  title: string;
  description: string;
  images: string[];
  createdBy: string;
  createdById: string;
  createdAt: string;
  takenBy: string | null;
  takenById: string | null;
  takenAt: string | null;
  comments: Comment[];
}

export default function FlohmiPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [inserate, setInserate] = useState<Inserat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);

  // Detail-Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const loadInserate = useCallback(async () => {
    try {
      const res = await fetch("/api/flohmi");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Inserat[];
      setInserate(data);
    } catch (err) {
      console.error("Flohmi laden", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInserate();
  }, [loadInserate]);

  // Server filtert bereits zu alte Inserate — wir zeigen einfach alles
  const visible = inserate;

  const selected = selectedId
    ? inserate.find((i) => i.id === selectedId) ?? null
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      if (editingId) {
        const res = await fetch(`/api/flohmi/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            description: newDesc,
            images: newImages,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated = (await res.json()) as Inserat;
        setInserate((prev) =>
          prev.map((i) => (i.id === editingId ? updated : i))
        );
      } else {
        const res = await fetch("/api/flohmi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            description: newDesc,
            images: newImages,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created = (await res.json()) as Inserat;
        setInserate((prev) => [created, ...prev]);
      }
      setNewTitle("");
      setNewDesc("");
      setNewImages([]);
      setEditingId(null);
      setShowCreate(false);
    } catch (err) {
      console.error("Inserat speichern", err);
      alert("Konnte Inserat nicht speichern.");
    }
  }

  function openEditInserat(ins: Inserat) {
    setEditingId(ins.id);
    setNewTitle(ins.title);
    setNewDesc(ins.description);
    setNewImages([...ins.images]);
    setShowCreate(true);
    setSelectedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Dieses Inserat wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/flohmi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInserate((prev) => prev.filter((i) => i.id !== id));
      setSelectedId(null);
    } catch (err) {
      console.error("Inserat löschen", err);
      alert("Konnte Inserat nicht löschen.");
    }
  }

  async function handleTake(id: string) {
    try {
      const res = await fetch(`/api/flohmi/${id}/take`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        takenBy: string | null;
        takenById: string | null;
        takenAt: string | null;
      };
      setInserate((prev) =>
        prev.map((ins) =>
          ins.id === id
            ? {
                ...ins,
                takenBy: data.takenBy,
                takenById: data.takenById,
                takenAt: data.takenAt,
              }
            : ins
        )
      );
    } catch (err) {
      console.error("Nehmen", err);
      alert("Konnte nicht als genommen markieren.");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Input direkt zuruecksetzen, damit dasselbe File erneut ausgewaehlt werden kann
    e.target.value = "";
    if (files.length === 0) return;
    if (newImages.length + files.length > 8) {
      alert("Maximal 8 Bilder pro Inserat.");
      return;
    }
    try {
      const compressed = await Promise.all(
        files.map((file) =>
          compressImage(file, { maxSize: 1024, quality: 0.8 })
        )
      );
      setNewImages((prev) => [...prev, ...compressed]);
    } catch (err) {
      console.error("Bild komprimieren", err);
      alert("Ein Bild konnte nicht verarbeitet werden.");
    }
  }

  function removeNewImage(i: number) {
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !selectedId) return;
    try {
      const res = await fetch(`/api/flohmi/${selectedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as Comment;
      setInserate((prev) =>
        prev.map((ins) =>
          ins.id === selectedId
            ? { ...ins, comments: [...ins.comments, created] }
            : ins
        )
      );
      setNewComment("");
    } catch (err) {
      console.error("Kommentar", err);
      alert("Kommentar konnte nicht gespeichert werden.");
    }
  }

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/pic-flohmi.webp"
        glowClass="glow-pink"
        showIcon={false}
      />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-flohmi.webp"
          alt=""
          className="tab-btn-icon glow-pink"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-pink-300">
        Flohmi
      </h1>
      <p className="mb-4 text-center text-sm text-pink-300/70">
        Dinge zum Weitergeben
      </p>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => {
            if (showCreate) {
              setShowCreate(false);
              setEditingId(null);
              setNewTitle("");
              setNewDesc("");
              setNewImages([]);
            } else {
              setEditingId(null);
              setNewTitle("");
              setNewDesc("");
              setNewImages([]);
              setShowCreate(true);
            }
          }}
          className="rounded-full bg-pink-500 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
        >
          {editingId ? "Inserat bearbeiten" : "+ Neues Inserat"}
        </button>
      </div>

      {/* Erstellen */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-pink-500/30 bg-pink-500/5 p-4"
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
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
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
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Fotos{" "}
              <span className="text-gray-600">
                (max 8, zum Durchswipen)
              </span>
            </label>
            {newImages.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {newImages.map((img, i) => (
                  <div key={i} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="h-20 w-20 rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-xs text-white"
                      aria-label="Entfernen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900 p-3 text-sm text-gray-500 transition-colors hover:border-pink-400 hover:text-pink-200">
              <span>
                {newImages.length === 0 ? "Fotos hochladen" : "+ Weitere Fotos"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-pink-500 px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              {editingId ? "Speichern" : "Inserieren"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditingId(null);
                setNewTitle("");
                setNewDesc("");
                setNewImages([]);
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
          const firstImg = ins.images[0];
          return (
            <button
              key={ins.id}
              onClick={() => {
                setSelectedId(ins.id);
                setImageIndex(0);
              }}
              className={`flex flex-col overflow-hidden rounded-lg border text-left ${
                isTaken
                  ? "border-pink-500/30 opacity-60"
                  : "border-gray-800 hover:border-gray-700"
              } bg-white/5`}
            >
              {firstImg ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstImg}
                    alt={ins.title}
                    className="h-28 w-full object-cover"
                  />
                  {ins.images.length > 1 && (
                    <span className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-white">
                      {ins.images.length} 📷
                    </span>
                  )}
                </div>
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

      {loading && visible.length === 0 && (
        <p className="mt-8 text-center text-gray-600">Lade …</p>
      )}
      {!loading && visible.length === 0 && (
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
            {selected.images.length > 0 ? (
              <div
                className="relative"
                onTouchStart={(e) =>
                  setTouchStartX(e.touches[0]?.clientX ?? null)
                }
                onTouchEnd={(e) => {
                  if (touchStartX === null) return;
                  const endX = e.changedTouches[0]?.clientX ?? touchStartX;
                  const dx = endX - touchStartX;
                  if (Math.abs(dx) > 40) {
                    if (dx < 0 && imageIndex < selected.images.length - 1) {
                      setImageIndex(imageIndex + 1);
                    } else if (dx > 0 && imageIndex > 0) {
                      setImageIndex(imageIndex - 1);
                    }
                  }
                  setTouchStartX(null);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.images[imageIndex]}
                  alt={selected.title}
                  className="max-h-[50vh] w-full select-none object-contain"
                  draggable={false}
                />
                {selected.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setImageIndex(Math.max(0, imageIndex - 1))
                      }
                      disabled={imageIndex === 0}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30"
                      aria-label="Vorheriges Bild"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setImageIndex(
                          Math.min(selected.images.length - 1, imageIndex + 1)
                        )
                      }
                      disabled={imageIndex === selected.images.length - 1}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm disabled:opacity-30"
                      aria-label="Naechstes Bild"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                      {selected.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            i === imageIndex ? "bg-white" : "bg-white/30"
                          }`}
                          aria-label={`Bild ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
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
                <p className="mt-3 text-sm text-pink-300">
                  ✓ Genommen von {selected.takenBy}
                </p>
              ) : (
                <button
                  onClick={() => {
                    handleTake(selected.id);
                  }}
                  className="mt-4 w-full rounded-full bg-pink-500 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-dark"
                >
                  Nehme ich!
                </button>
              )}

              {/* Edit + Delete fuer eigene Inserate */}
              {(selected.createdById === currentUserId || isAdmin) && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEditInserat(selected)}
                    className="flex-1 rounded border border-pink-500/50 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pink-200 hover:bg-pink-500/10"
                  >
                    ✎ Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="flex-1 rounded border border-red-500/40 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                  >
                    Löschen
                  </button>
                </div>
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
                    className="flex-1 rounded border border-gray-800 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-pink-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded bg-pink-500 px-3 py-1.5 text-[10px] font-bold text-dark"
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
