"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Traktandum {
  id: string;
  title: string;
  notes: string | null;
  order: number;
}

interface Comment {
  id: string;
  text: string;
  author: { id: string; name: string; avatar: string | null };
  createdAt: string;
}

interface Termin {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  location: string | null;
  description: string | null;
  protokoll: string | null;
  createdBy: { id: string; name: string };
  traktanden: Traktandum[];
  comments: Comment[];
}

interface Props {
  slug: string;
  wgName: string;
  terminId: string;
  meId: string;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TerminDetailClient({ slug, wgName, terminId, meId }: Props) {
  const router = useRouter();
  const [termin, setTermin] = useState<Termin | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editProto, setEditProto] = useState(false);
  const [newTraktandum, setNewTraktandum] = useState("");
  const [newComment, setNewComment] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/termine/${terminId}`);
      if (!res.ok) return;
      setTermin((await res.json()) as Termin);
    } finally {
      setLoading(false);
    }
  }, [slug, terminId]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteTermin() {
    if (!confirm("Termin wirklich loeschen?")) return;
    await fetch(`/api/meine-wg/${slug}/termine/${terminId}`, {
      method: "DELETE",
    });
    router.push(`/meine-wg/${slug}/termine`);
  }

  async function addTraktandum() {
    const t = newTraktandum.trim();
    if (!t) return;
    await fetch(
      `/api/meine-wg/${slug}/termine/${terminId}/traktanden`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      }
    );
    setNewTraktandum("");
    load();
  }

  async function deleteTraktandum(tId: string) {
    if (!confirm("Traktandum loeschen?")) return;
    await fetch(
      `/api/meine-wg/${slug}/termine/${terminId}/traktanden/${tId}`,
      { method: "DELETE" }
    );
    load();
  }

  async function patchTraktandumNotes(tId: string, notes: string) {
    await fetch(
      `/api/meine-wg/${slug}/termine/${terminId}/traktanden/${tId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }
    );
    load();
  }

  async function addComment() {
    const t = newComment.trim();
    if (!t) return;
    await fetch(`/api/meine-wg/${slug}/termine/${terminId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    setNewComment("");
    load();
  }

  async function deleteComment(cId: string) {
    if (!confirm("Kommentar loeschen?")) return;
    await fetch(
      `/api/meine-wg/${slug}/termine/${terminId}/comments/${cId}`,
      { method: "DELETE" }
    );
    load();
  }

  if (loading || !termin) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
        <div className="pt-14">
          <Link
            href={`/meine-wg/${slug}/termine`}
            className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-300/80 hover:text-fuchsia-200"
          >
            ← {wgName} · Termine
          </Link>
          <p className="mt-4 text-sm text-fuchsia-300/60">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <div className="relative pt-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 wg-bg-glow" />
        <Link
          href={`/meine-wg/${slug}/termine`}
          className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-300/80 hover:text-fuchsia-200"
        >
          ← {wgName} · Termine
        </Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="wg-title-gradient font-cinzel text-3xl font-medium leading-tight">
            {termin.title}
          </h1>
          <div className="mt-2 flex shrink-0 gap-1">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-white"
            >
              ✎
          </button>
            <button
              onClick={deleteTermin}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 mt-3 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
        <p className="font-mono text-xs uppercase tracking-wider text-secondary">
          {fmtDateTime(termin.date)}
        </p>
        {termin.location && (
          <p className="mt-0.5 text-sm text-gray-300">📍 {termin.location}</p>
        )}
        {termin.description && (
          <p className="mt-1 whitespace-pre-line text-xs text-gray-400">
            {termin.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={`/api/meine-wg/${slug}/termine/${terminId}/ics`}
            className="rounded border border-gray-700 px-2 py-1 font-mono text-[10px] uppercase text-gray-300 hover:border-accent hover:text-accent"
          >
            📥 .ics
          </a>
          <p className="text-[10px] text-gray-600">
            angelegt von {termin.createdBy.name}
          </p>
        </div>
      </div>

      <Section title="Traktanden">
        <div className="space-y-2">
          {termin.traktanden.length === 0 ? (
            <p className="text-xs italic text-gray-600">noch keine</p>
          ) : (
            termin.traktanden.map((tr, i) => (
              <TraktandumRow
                key={tr.id}
                index={i + 1}
                tr={tr}
                onDelete={() => deleteTraktandum(tr.id)}
                onSaveNotes={(notes) => patchTraktandumNotes(tr.id, notes)}
              />
            ))
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newTraktandum}
            onChange={(e) => setNewTraktandum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTraktandum()}
            placeholder="+ Neues Traktandum"
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
          />
          <button
            onClick={addTraktandum}
            disabled={!newTraktandum.trim()}
            className="rounded bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </Section>

      <Section title="Protokoll">
        <ProtokollEditor
          slug={slug}
          terminId={terminId}
          initial={termin.protokoll ?? ""}
          editing={editProto}
          onEdit={() => setEditProto(true)}
          onSaved={() => {
            setEditProto(false);
            load();
          }}
          onCancel={() => setEditProto(false)}
        />
      </Section>

      <Section title={`Kommentare (${termin.comments.length})`}>
        <div className="space-y-2">
          {termin.comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-gray-800 bg-gray-900/40 p-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs">
                  <span className="font-medium text-accent">
                    {c.author.name}
                  </span>{" "}
                  <span className="text-gray-600">
                    · {fmtDateTime(c.createdAt)}
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
              <p className="mt-0.5 whitespace-pre-line text-sm text-gray-200">
                {c.text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment()}
            placeholder="Kommentar..."
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className="rounded bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
          >
            ↵
          </button>
        </div>
      </Section>

      {editing && (
        <EditTerminModal
          slug={slug}
          termin={termin}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function TraktandumRow({
  index,
  tr,
  onDelete,
  onSaveNotes,
}: {
  index: number;
  tr: Traktandum;
  onDelete: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(tr.notes ?? "");

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white">
          <span className="font-mono text-secondary">{index}.</span> {tr.title}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-[10px] text-gray-500 hover:text-white"
          >
            {editing ? "✓" : "📝"}
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] text-gray-500 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>
      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            onSaveNotes(notes);
            setEditing(false);
          }}
          rows={2}
          autoFocus
          placeholder="Notizen..."
          className="mt-1 w-full resize-none rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-accent focus:outline-none"
        />
      ) : (
        tr.notes && (
          <p className="mt-1 whitespace-pre-line text-xs text-gray-400">
            {tr.notes}
          </p>
        )
      )}
    </div>
  );
}

function ProtokollEditor({
  slug,
  terminId,
  initial,
  editing,
  onEdit,
  onSaved,
  onCancel,
}: {
  slug: string;
  terminId: string;
  initial: string;
  editing: boolean;
  onEdit: () => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/meine-wg/${slug}/termine/${terminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protokoll: text }),
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <div>
        {initial ? (
          <p className="whitespace-pre-line rounded-lg border border-gray-800 bg-gray-900/40 p-3 text-sm text-gray-200">
            {initial}
          </p>
        ) : (
          <p className="text-xs italic text-gray-600">noch leer</p>
        )}
        <button
          onClick={onEdit}
          className="mt-2 rounded border border-gray-700 px-2 py-1 font-mono text-[10px] uppercase text-gray-400 hover:border-accent hover:text-accent"
        >
          ✎ Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        autoFocus
        placeholder="Protokoll..."
        className="w-full resize-y rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "..." : "Speichern"}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-gray-700 px-3 py-1 font-mono text-[10px] uppercase text-gray-400"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function EditTerminModal({
  slug,
  termin,
  onClose,
  onSaved,
}: {
  slug: string;
  termin: Termin;
  onClose: () => void;
  onSaved: () => void;
}) {
  const d = new Date(termin.date);
  const [title, setTitle] = useState(termin.title);
  const [date, setDate] = useState(d.toISOString().slice(0, 10));
  const [time, setTime] = useState(
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  );
  const [location, setLocation] = useState(termin.location ?? "");
  const [description, setDescription] = useState(termin.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const dateIso = new Date(`${date}T${time}`).toISOString();
      await fetch(`/api/meine-wg/${slug}/termine/${termin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: dateIso,
          location: location.trim() || null,
          description: description.trim() || null,
        }),
      });
      onSaved();
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
        <h2 className="mb-3 font-cinzel text-lg text-accent">
          Termin bearbeiten
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <div className="mb-2 flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ort"
          className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Beschreibung"
          className="mb-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "..." : "Speichern"}
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
