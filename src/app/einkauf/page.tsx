"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

interface ShoppingItem {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  createdBy: string;
  createdById: string;
  completedBy: string | null;
  completedById: string | null;
  completedAt: string | null;
  createdAt: string;
  commentCount: number;
}

interface ShoppingComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  date: string;
}

export default function EinkaufPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user?.roles || []).includes("ADMIN");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"offen" | "erledigt">("offen");

  // Comment-Modal
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
  const [comments, setComments] = useState<ShoppingComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/einkauf");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ShoppingItem[];
      setItems(data);
    } catch (err) {
      console.error("einkauf laden", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setShowAdd(false);
    setEditingId(null);
    setNewTitle("");
    setNewNotes("");
  }

  function openEdit(item: ShoppingItem) {
    setEditingId(item.id);
    setNewTitle(item.title);
    setNewNotes(item.notes);
    setShowAdd(true);
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/einkauf/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle, notes: newNotes }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated = (await res.json()) as ShoppingItem;
        setItems((prev) =>
          prev.map((i) => (i.id === editingId ? updated : i))
        );
      } else {
        const res = await fetch("/api/einkauf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle, notes: newNotes }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created = (await res.json()) as ShoppingItem;
        setItems((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error("einkauf speichern", err);
      alert("Konnte Eintrag nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(item: ShoppingItem) {
    try {
      const res = await fetch(`/api/einkauf/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as ShoppingItem;
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error("einkauf toggle", err);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/einkauf/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("einkauf loeschen", err);
    }
  }

  async function openComments(id: string) {
    setCommentsOpenId(id);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/einkauf/${id}/comments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ShoppingComment[];
      setComments(data);
    } catch (err) {
      console.error("comments laden", err);
    } finally {
      setCommentsLoading(false);
    }
  }

  function closeComments() {
    setCommentsOpenId(null);
    setComments([]);
    setNewComment("");
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !commentsOpenId) return;
    try {
      const res = await fetch(`/api/einkauf/${commentsOpenId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = (await res.json()) as ShoppingComment;
      setComments((prev) => [...prev, created]);
      setNewComment("");
      setItems((prev) =>
        prev.map((i) =>
          i.id === commentsOpenId
            ? { ...i, commentCount: (i.commentCount ?? 0) + 1 }
            : i
        )
      );
    } catch (err) {
      console.error("comment add", err);
      alert("Konnte Kommentar nicht speichern.");
    }
  }

  async function deleteComment(cid: string) {
    try {
      const res = await fetch(`/api/einkauf/comments/${cid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setComments((prev) => prev.filter((c) => c.id !== cid));
      setItems((prev) =>
        prev.map((i) =>
          i.id === commentsOpenId
            ? { ...i, commentCount: Math.max(0, (i.commentCount ?? 1) - 1) }
            : i
        )
      );
    } catch (err) {
      console.error("comment delete", err);
    }
  }

  const offen = items.filter((i) => !i.done);
  const erledigt = items.filter((i) => i.done);
  const visible = filter === "offen" ? offen : erledigt;
  const activeItem = commentsOpenId
    ? items.find((i) => i.id === commentsOpenId) ?? null
    : null;

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/icon-einkauf.webp"
        glowClass="glow-violet"
        showIcon={false}
      />
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-einkauf.webp"
          alt=""
          className="tab-btn-icon glow-violet"
          loading="eager"
          fetchPriority="high"
        />
        <button
          onClick={() => {
            if (showAdd) {
              resetForm();
            } else {
              setEditingId(null);
              setNewTitle("");
              setNewNotes("");
              setShowAdd(true);
            }
          }}
          className="rounded-full border border-violet-400/50 bg-violet-400/15 px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-violet-400/25"
        >
          {editingId ? "Eintrag bearbeiten" : "+ Neuer Eintrag"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={saveItem}
          className="mb-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Was wird gebraucht?
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Anzündwürfel, Holzbriketts, Holz..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Notizen (optional)
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Menge, Marke, wo kaufen..."
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-violet-500 px-4 py-2 font-mono text-xs font-bold text-dark disabled:opacity-50"
            >
              {saving ? "…" : editingId ? "Speichern" : "Hinzufügen"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Tabs: Offen / Erledigt */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setFilter("offen")}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
            filter === "offen"
              ? "bg-violet-500 text-dark"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Offen ({offen.length})
        </button>
        <button
          onClick={() => setFilter("erledigt")}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
            filter === "erledigt"
              ? "bg-violet-500/60 text-dark"
              : "border border-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Erledigt ({erledigt.length})
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {visible.map((item) => {
          const isOwn = item.createdById === currentUserId;
          const canEdit = isOwn || isAdmin;
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-3 transition-all ${
                item.done
                  ? "border-gray-800 bg-gray-900/40 opacity-70"
                  : "border-violet-500/30 bg-violet-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDone(item)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${
                    item.done
                      ? "border-violet-400 bg-violet-500 text-white"
                      : "border-gray-600 hover:border-violet-400"
                  }`}
                  aria-label={item.done ? "Auf offen setzen" : "Als erledigt markieren"}
                >
                  {item.done && "✓"}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      item.done ? "text-gray-500 line-through" : "text-white"
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.notes && (
                    <p className="mt-0.5 text-xs text-gray-400">{item.notes}</p>
                  )}
                  <p className="mt-1 font-mono text-[9px] text-gray-600">
                    von {item.createdBy} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "short",
                    })}
                    {item.done && item.completedBy && item.completedAt && (
                      <>
                        {" · "}
                        erledigt von {item.completedBy} am{" "}
                        {new Date(item.completedAt).toLocaleDateString(
                          "de-CH",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    onClick={() => openComments(item.id)}
                    className="rounded px-1.5 py-0.5 text-[11px] text-violet-300/80 hover:bg-violet-500/10 hover:text-violet-200"
                    aria-label="Kommentare"
                  >
                    💬
                    {(item.commentCount ?? 0) > 0 && (
                      <span className="ml-0.5">{item.commentCount}</span>
                    )}
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded px-1.5 py-0.5 text-[11px] text-violet-300/80 hover:bg-violet-500/10 hover:text-violet-200"
                      aria-label="Bearbeiten"
                    >
                      ✎
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded px-1.5 text-[14px] leading-none text-gray-600 hover:text-red-400"
                      aria-label="Loeschen"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-600">Lade …</p>
      )}
      {!loading && visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-gray-600">
          {filter === "offen"
            ? "Nichts auf der Liste 🎉"
            : "Noch nichts erledigt"}
        </p>
      )}

      {/* Kommentar-Modal */}
      {commentsOpenId && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)]"
          onClick={closeComments}
        >
          <div
            className="my-4 w-full max-w-md rounded-2xl border border-gray-800 bg-dark pb-[env(safe-area-inset-bottom,0px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 border-b border-gray-800 bg-dark/95 px-5 py-3 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <p className="font-display text-[10px] font-bold uppercase tracking-widest text-violet-300">
                  EINKAUF
                </p>
                <button
                  onClick={closeComments}
                  className="text-gray-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-5">
              {activeItem && (
                <div className="mb-4 rounded-lg border border-gray-800 bg-white/5 p-3">
                  <p className="text-sm font-medium text-white">
                    {activeItem.title}
                  </p>
                  {activeItem.notes && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {activeItem.notes}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[10px] text-gray-500">
                    — {activeItem.createdBy}
                  </p>
                </div>
              )}

              <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-violet-300">
                KOMMENTARE {comments.length > 0 && `(${comments.length})`}
              </p>

              {commentsLoading ? (
                <p className="text-center text-xs text-gray-600">Laden…</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-gray-600">
                  Noch keine Kommentare
                </p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => {
                    const canDeleteComment = c.authorId === currentUserId || isAdmin;
                    return (
                      <div
                        key={c.id}
                        className="rounded border-l-2 border-violet-500/50 bg-white/5 px-2 py-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1 text-xs text-gray-200">
                            {c.text}
                          </p>
                          {canDeleteComment && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="text-[10px] text-gray-600 hover:text-red-400"
                              aria-label="Loeschen"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-[9px] text-gray-500">
                          — {c.author} ·{" "}
                          {new Date(c.date).toLocaleDateString("de-CH", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={addComment} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Kommentar schreiben…"
                  className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-violet-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded bg-violet-500 px-3 py-2 font-display text-[10px] font-bold text-dark"
                >
                  OK
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
