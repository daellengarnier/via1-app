"use client";

import { useCallback, useEffect, useState } from "react";
import { WgPageHeader } from "@/components/WgPageHeader";

interface Person {
  id: string;
  name: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  text: string;
  author: Person;
  createdAt: string;
}

interface Item {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
  createdBy: Person;
  doneBy: Person | null;
  comments: Comment[];
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EinkaufClient({ slug, wgName, meId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/einkauf`);
      if (!res.ok) return;
      setItems((await res.json()) as Item[]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/einkauf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (res.ok) {
        setText("");
        load();
      }
    } finally {
      setAdding(false);
    }
  }

  async function toggleDone(item: Item) {
    setItems((cur) =>
      cur.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
    );
    await fetch(`/api/meine-wg/${slug}/einkauf/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Wirklich loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/einkauf/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditText(item.text);
  }

  async function saveEdit(id: string) {
    const t = editText.trim();
    if (!t) {
      setEditingId(null);
      return;
    }
    await fetch(`/api/meine-wg/${slug}/einkauf/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    setEditingId(null);
    load();
  }

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="🛒 Einkauf"
      />
      <div className="h-4" />

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was muss eingekauft werden?"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={adding || !text.trim()}
          className="rounded-lg bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
        >
          +
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Lade...</p>
      ) : (
        <>
          <div className="space-y-1">
            {open.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-800 px-3 py-6 text-center text-xs italic text-gray-600">
                Liste ist leer
              </p>
            ) : (
              open.map((item) => (
                <ItemRow
                  key={item.id}
                  slug={slug}
                  item={item}
                  meId={meId}
                  expanded={expandedId === item.id}
                  isEditing={editingId === item.id}
                  editText={editText}
                  setEditText={setEditText}
                  onExpand={() =>
                    setExpandedId((cur) => (cur === item.id ? null : item.id))
                  }
                  onStartEdit={() => startEdit(item)}
                  onSaveEdit={() => saveEdit(item.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleDone={() => toggleDone(item)}
                  onRemove={() => remove(item.id)}
                  onChanged={load}
                />
              ))
            )}
          </div>

          {done.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowDone((v) => !v)}
                className="mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-white"
              >
                {showDone ? "▼" : "▶"} Erledigt ({done.length})
              </button>
              {showDone && (
                <div className="space-y-1 opacity-60">
                  {done.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/20 px-2 py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleDone(item)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-white"
                      />
                      <span className="flex-1 text-sm text-gray-400 line-through">
                        {item.text}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {item.doneBy?.name ?? "?"}
                      </span>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-xs text-gray-600 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ItemRow({
  slug,
  item,
  meId,
  expanded,
  isEditing,
  editText,
  setEditText,
  onExpand,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleDone,
  onRemove,
  onChanged,
}: {
  slug: string;
  item: Item;
  meId: string;
  expanded: boolean;
  isEditing: boolean;
  editText: string;
  setEditText: (s: string) => void;
  onExpand: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleDone: () => void;
  onRemove: () => void;
  onChanged: () => void;
}) {
  const [newComment, setNewComment] = useState("");

  async function addComment() {
    const t = newComment.trim();
    if (!t) return;
    await fetch(`/api/meine-wg/${slug}/einkauf/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    setNewComment("");
    onChanged();
  }

  async function deleteComment(cId: string) {
    await fetch(
      `/api/meine-wg/${slug}/einkauf/${item.id}/comments/${cId}`,
      { method: "DELETE" }
    );
    onChanged();
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40">
      <div className="flex items-center gap-2 px-2 py-2">
        <input
          type="checkbox"
          checked={item.done}
          onChange={onToggleDone}
          className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-white"
        />
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="flex-1 rounded border border-secondary/40 bg-gray-900 px-2 py-1 text-sm text-white focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={onExpand}
            className="flex-1 text-left text-sm text-white"
          >
            <span>{item.text}</span>
            <span className="ml-2 text-[10px] text-gray-500">
              · {item.createdBy.name}
            </span>
            {item.comments.length > 0 && (
              <span className="ml-2 text-[10px] text-secondary">
                💬 {item.comments.length}
              </span>
            )}
          </button>
        )}
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="text-[10px] text-gray-600 hover:text-white"
            title="Bearbeiten"
          >
            ✎
          </button>
        )}
        <button
          onClick={onRemove}
          className="text-xs text-gray-600 hover:text-red-400"
          title="Loeschen"
        >
          ✕
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 bg-black/30 px-3 py-2">
          {item.comments.length > 0 && (
            <div className="mb-2 space-y-1">
              {item.comments.map((c) => (
                <div key={c.id} className="text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <p>
                      <span className="font-medium text-white">
                        {c.author.name}
                      </span>
                      <span className="ml-1 text-[10px] text-gray-600">
                        {fmtDateTime(c.createdAt)}
                      </span>
                    </p>
                    {c.author.id === meId && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-[10px] text-gray-600 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-line text-gray-200">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="Kommentar / Notiz (z.B. 'Marke X', '500g')"
              maxLength={500}
              className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-white/50 focus:outline-none"
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="rounded bg-white px-2 py-1 text-[10px] font-bold uppercase text-black hover:brightness-90 disabled:opacity-50"
            >
              ↵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
