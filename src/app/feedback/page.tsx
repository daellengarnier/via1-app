"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type FeedbackType = "idea" | "bug";

interface FeedbackComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  authorName: string;
  status: string;
  createdAt: string;
  comments: FeedbackComment[];
}

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<"alle" | "idea" | "bug">("alle");
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) return;
      const data = (await res.json()) as FeedbackItem[];
      setItems(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, type }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setDescription("");
      setShowCreate(false);
      await loadItems();
    } catch {
      alert("Konnte nicht gespeichert werden.");
    } finally {
      setLoading(false);
    }
  }

  async function addComment(feedbackId: string) {
    const text = newComment.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const comment = (await res.json()) as FeedbackComment;
      setItems((prev) =>
        prev.map((i) =>
          i.id === feedbackId
            ? { ...i, comments: [...i.comments, comment] }
            : i
        )
      );
      setNewComment("");
    } catch {
      alert("Kommentar fehlgeschlagen.");
    }
  }

  const filtered =
    filter === "alle" ? items : items.filter((i) => i.type === filter);

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">
        Feedback
      </h1>
      <p className="mb-4 text-center text-xs text-gray-500">
        Ideen und Bugs — von allen, für alle
      </p>

      {/* Erstellen-Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`rounded-full px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider transition-colors ${
            showCreate
              ? "border border-gray-700 text-gray-400"
              : "bg-accent text-dark"
          }`}
        >
          {showCreate ? "Abbrechen" : "+ Neuer Eintrag"}
        </button>
      </div>

      {/* Erstellen-Formular */}
      {showCreate && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setType("idea")}
              className={`flex-1 rounded py-1.5 font-mono text-xs font-bold transition-colors ${
                type === "idea"
                  ? "bg-accent text-dark"
                  : "border border-gray-700 text-gray-400"
              }`}
            >
              💡 Idee
            </button>
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`flex-1 rounded py-1.5 font-mono text-xs font-bold transition-colors ${
                type === "bug"
                  ? "bg-secondary text-white"
                  : "border border-gray-700 text-gray-400"
              }`}
            >
              🐛 Bug
            </button>
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "bug"
                  ? "Was ist kaputt?"
                  : "Deine Idee in einem Satz"
              }
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mehr Details (optional)..."
              className="w-full resize-none rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded py-2 font-mono text-xs font-bold transition disabled:opacity-50 ${
              type === "bug"
                ? "bg-secondary text-white"
                : "bg-accent text-dark"
            }`}
          >
            {loading ? "Wird gespeichert..." : "Absenden"}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="mb-3 flex gap-2">
        {(["alle", "idea", "bug"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-full py-1.5 font-mono text-[10px] font-bold uppercase transition-colors ${
              filter === f
                ? f === "bug"
                  ? "bg-secondary/80 text-white"
                  : "bg-accent text-dark"
                : "border border-gray-800 text-gray-500"
            }`}
          >
            {f === "alle"
              ? `Alle (${items.length})`
              : f === "idea"
                ? `💡 Ideen (${items.filter((i) => i.type === "idea").length})`
                : `🐛 Bugs (${items.filter((i) => i.type === "bug").length})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-3 ${
                item.type === "bug"
                  ? "border-secondary/30 bg-secondary/5"
                  : "border-accent/20 bg-accent/5"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : item.id)
                }
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {item.type === "bug" ? "🐛" : "💡"}
                      </span>
                      <h3 className="text-sm font-medium text-white">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {item.authorName} · {item.createdAt}
                      {item.comments.length > 0 && (
                        <span className="ml-2 text-gray-600">
                          💬 {item.comments.length}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-gray-600">
                    {isExpanded ? "▾" : "›"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-2 border-t border-gray-800 pt-2">
                  {item.description && (
                    <p className="mb-2 text-xs text-gray-400">
                      {item.description}
                    </p>
                  )}

                  {/* Kommentare */}
                  {item.comments.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {item.comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded bg-white/5 px-2.5 py-1.5"
                        >
                          <p className="text-xs text-white">{c.text}</p>
                          <p className="mt-0.5 text-[9px] text-gray-600">
                            {c.authorName} · {c.createdAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kommentar schreiben */}
                  {session?.user && (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={expandedId === item.id ? newComment : ""}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addComment(item.id);
                          }
                        }}
                        placeholder="Kommentar..."
                        className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
                      />
                      <button
                        onClick={() => addComment(item.id)}
                        className="shrink-0 rounded bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/30"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-600">
            Noch keine Einträge.
          </p>
        )}
      </div>
    </div>
  );
}
