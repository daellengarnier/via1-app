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

const COLOR_BG: Record<PinnwandColor, string> = {
  yellow: "bg-yellow-200 text-yellow-950",
  pink: "bg-pink-200 text-pink-950",
  blue: "bg-sky-200 text-sky-950",
  green: "bg-lime-200 text-lime-950",
  orange: "bg-orange-200 text-orange-950",
  purple: "bg-violet-200 text-violet-950",
};

const COLOR_DOT: Record<PinnwandColor, string> = {
  yellow: "bg-yellow-300",
  pink: "bg-pink-300",
  blue: "bg-sky-300",
  green: "bg-lime-300",
  orange: "bg-orange-300",
  purple: "bg-violet-300",
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
  const bg = COLOR_BG[color];
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
      className={`${bg} ${
        expanded ? "col-span-2" : ""
      } cursor-pointer rounded-lg p-3 shadow-md transition-transform hover:rotate-1`}
      onClick={onToggle}
    >
      <p className="whitespace-pre-line text-sm font-medium">{note.text}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] opacity-70">
        <span>— {note.author.name}</span>
        <span>{fmtDate(note.createdAt)}</span>
      </div>
      {note.comments.length > 0 && !expanded && (
        <p className="mt-1 text-[10px] opacity-70">
          💬 {note.comments.length}
        </p>
      )}
      {expanded && (
        <div
          className="mt-3 space-y-2 border-t border-black/10 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {note.comments.map((c) => (
            <div key={c.id} className="text-xs">
              <p className="font-medium">{c.author.name}</p>
              <p className="whitespace-pre-line">{c.text}</p>
              <div className="flex items-center justify-between text-[9px] opacity-60">
                <span>{fmtDate(c.createdAt)}</span>
                {c.author.id === meId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="hover:text-red-700"
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
              className="flex-1 rounded border border-black/20 bg-white/50 px-2 py-1 text-xs placeholder-black/40 focus:border-black/50 focus:outline-none"
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="rounded bg-black/10 px-2 py-1 text-[10px] font-bold uppercase hover:bg-black/20 disabled:opacity-40"
            >
              ↵
            </button>
          </div>
          {isMine && (
            <button
              onClick={deleteNote}
              className="text-[10px] underline opacity-60 hover:opacity-100"
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
          className={`mb-3 w-full resize-none rounded-lg border-2 p-3 text-sm font-medium ${COLOR_BG[color]} border-transparent focus:outline-none`}
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
