"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Person {
  id: string;
  name: string;
  avatar: string | null;
}

interface Item {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  doneAt: string | null;
  createdBy: Person;
  doneBy: Person | null;
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

export function EinkaufClient({ slug, wgName }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDone, setShowDone] = useState(false);

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
    <div className="mx-auto min-h-screen max-w-md px-4 py-6 pb-24">
      <Link
        href={`/meine-wg/${slug}`}
        className="font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-accent"
      >
        ← {wgName}
      </Link>
      <h1 className="mb-4 font-cinzel text-3xl text-accent">🛒 Einkauf</h1>

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was muss eingekauft werden?"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={adding || !text.trim()}
          className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
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
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/40 px-2 py-2"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleDone(item)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-accent"
                  />
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(item.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 rounded border border-secondary/40 bg-gray-900 px-2 py-1 text-sm text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex-1 text-left text-sm text-white"
                    >
                      <span>{item.text}</span>
                      <span className="ml-2 text-[10px] text-gray-500">
                        · {item.createdBy.name}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="text-xs text-gray-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {done.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowDone((v) => !v)}
                className="mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-accent"
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
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-accent"
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
