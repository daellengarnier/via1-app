"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PINNWAND_COLORS,
  type PinnwandColor,
} from "@/lib/wg-pinnwand-colors";
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

interface Note {
  id: string;
  text: string;
  color: string;
  author: Person;
  createdAt: string;
  comments: Comment[];
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

// Sticky-Note-Optik wie auf Home, aber **leuchtende** Farben (hoehere Saettigung).
interface ColorStyle {
  grad: string; // Tailwind: from-X to-Y
  border: string;
  text: string; // Haupt-Text
  meta: string; // Sub-Text (Author/Datum)
  rot: string; // leichte Rotation
}

const COLOR_STYLE: Record<PinnwandColor, ColorStyle> = {
  yellow: {
    grad: "from-yellow-300/60 to-yellow-500/30",
    border: "border-yellow-300/50",
    text: "text-yellow-50",
    meta: "text-yellow-200/90",
    rot: "-rotate-1",
  },
  pink: {
    grad: "from-pink-400/60 to-pink-600/30",
    border: "border-pink-300/50",
    text: "text-pink-50",
    meta: "text-pink-200/90",
    rot: "rotate-1",
  },
  blue: {
    grad: "from-cyan-300/60 to-sky-500/30",
    border: "border-cyan-300/50",
    text: "text-cyan-50",
    meta: "text-cyan-200/90",
    rot: "-rotate-2",
  },
  green: {
    grad: "from-lime-300/60 to-emerald-500/30",
    border: "border-lime-300/50",
    text: "text-lime-50",
    meta: "text-lime-200/90",
    rot: "rotate-2",
  },
  orange: {
    grad: "from-orange-300/60 to-orange-500/30",
    border: "border-orange-300/50",
    text: "text-orange-50",
    meta: "text-orange-200/90",
    rot: "-rotate-1",
  },
  purple: {
    grad: "from-fuchsia-400/60 to-violet-600/30",
    border: "border-fuchsia-300/50",
    text: "text-fuchsia-50",
    meta: "text-fuchsia-200/90",
    rot: "rotate-1",
  },
};

const COLOR_DOT: Record<PinnwandColor, string> = {
  yellow: "bg-yellow-300",
  pink: "bg-pink-400",
  blue: "bg-cyan-300",
  green: "bg-lime-300",
  orange: "bg-orange-300",
  purple: "bg-fuchsia-400",
};

function isColor(c: string): c is PinnwandColor {
  return (PINNWAND_COLORS as readonly string[]).includes(c);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PinnwandClient({ slug, wgName, meId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/pinnwand`);
      if (!res.ok) return;
      setNotes((await res.json()) as Note[]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="📌 Pinnwand"
      />
      <div className="mb-4 mt-3 flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-fuchsia-200 hover:bg-fuchsia-500/20"
        >
          + Post-It
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Lade...</p>
      ) : notes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-800 px-3 py-8 text-center text-xs italic text-gray-600">
          Pinnwand ist leer.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              meId={meId}
              expanded={expanded === n.id}
              onToggle={() =>
                setExpanded((cur) => (cur === n.id ? null : n.id))
              }
              slug={slug}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddNoteModal
          slug={slug}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NoteCard({
  note,
  meId,
  expanded,
  onToggle,
  slug,
  onChanged,
}: {
  note: Note;
  meId: string;
  expanded: boolean;
  onToggle: () => void;
  slug: string;
  onChanged: () => void;
}) {
  const color: PinnwandColor = isColor(note.color) ? note.color : "yellow";
  const style = COLOR_STYLE[color];
  const isMine = note.author.id === meId;
  const [newComment, setNewComment] = useState("");

  async function addComment() {
    const t = newComment.trim();
    if (!t) return;
    await fetch(`/api/meine-wg/${slug}/pinnwand/${note.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    setNewComment("");
    onChanged();
  }

  async function deleteNote() {
    if (!confirm("Post-It loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/pinnwand/${note.id}`, {
      method: "DELETE",
    });
    onChanged();
  }

  async function deleteComment(cId: string) {
    await fetch(
      `/api/meine-wg/${slug}/pinnwand/${note.id}/comments/${cId}`,
      { method: "DELETE" }
    );
    onChanged();
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        style.border
      } bg-gradient-to-br ${style.grad} ${
        expanded ? "col-span-2 rotate-0" : style.rot
      } cursor-pointer p-3 pb-7 shadow-lg backdrop-blur-md transition-transform hover:rotate-0 hover:scale-105`}
      style={{
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
      onClick={onToggle}
    >
      {/* Glassy highlight oben */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent" />

      <p
        className={`relative whitespace-pre-line pt-1 text-sm font-medium leading-relaxed ${style.text}`}
      >
        {note.text}
      </p>
      <div
        className={`absolute bottom-1.5 left-3 right-3 flex items-end justify-between font-mono text-[10px] ${style.meta}`}
      >
        <span>— {note.author.name}</span>
        {note.comments.length > 0 && !expanded ? (
          <span>💬 {note.comments.length}</span>
        ) : (
          <span>{fmtDate(note.createdAt)}</span>
        )}
      </div>

      {expanded && (
        <div
          className={`relative mt-4 space-y-2 border-t border-white/20 pt-2 ${style.text}`}
          onClick={(e) => e.stopPropagation()}
        >
          {note.comments.map((c) => (
            <div key={c.id} className="text-xs">
              <p className={`font-medium ${style.meta}`}>{c.author.name}</p>
              <p className="whitespace-pre-line">{c.text}</p>
              <div
                className={`flex items-center justify-between text-[9px] ${style.meta} opacity-80`}
              >
                <span>{fmtDate(c.createdAt)}</span>
                {c.author.id === meId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="hover:text-red-200"
                  >
                    loeschen
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-1">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="Kommentar..."
              className={`flex-1 rounded border border-white/20 bg-white/10 px-2 py-1 text-xs placeholder-white/40 focus:border-white/40 focus:outline-none ${style.text}`}
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="rounded bg-white/20 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/30 disabled:opacity-40"
            >
              ↵
            </button>
          </div>
          {isMine && (
            <button
              onClick={deleteNote}
              className={`text-[10px] underline opacity-70 hover:opacity-100 ${style.meta}`}
            >
              Post-It loeschen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddNoteModal({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [color, setColor] = useState<PinnwandColor>("yellow");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/pinnwand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), color }),
      });
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-cinzel text-lg text-accent">Neuer Post-It</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
          maxLength={500}
          placeholder="Was willst du loswerden?"
          className={`mb-3 w-full resize-none rounded-2xl border bg-gradient-to-br ${COLOR_STYLE[color].grad} ${COLOR_STYLE[color].border} ${COLOR_STYLE[color].text} p-3 text-sm font-medium shadow-lg backdrop-blur-md focus:outline-none`}
          style={{
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        />
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
          Farbe
        </p>
        <div className="mb-3 flex gap-2">
          {PINNWAND_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ${COLOR_DOT[c]} ${
                color === c
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-gray-950"
                  : ""
              }`}
              aria-label={c}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy || !text.trim()}
            className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "..." : "Pinnen"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
