"use client";

import { useCallback, useEffect, useState } from "react";
import { overdueRoast } from "@/lib/wg-aemtli";
import { WgPageHeader } from "@/components/WgPageHeader";

interface Person {
  id: string;
  name: string;
  avatar: string | null;
  keyNumber?: string | null;
}

interface Aemtli {
  id: string;
  title: string;
  description: string | null;
  intervalDays: number;
  mandatory: boolean;
  active: boolean;
  lastDoneAt: string | null;
  lastDoneBy: Person | null;
  nextMember: Person | null;
  totalDone: number;
  overdueDays: number;
}

interface Data {
  members: Person[];
  aemtli: Aemtli[];
}

interface HistoryEntry {
  id: string;
  doneAt: string;
  notes: string | null;
  aemtli: { id: string; title: string };
  user: Person;
}

interface Props {
  slug: string;
  wgName: string;
  meId: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "noch nie";
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AemtliClient({ slug, wgName }: Props) {
  const [data, setData] = useState<Data | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Aemtli | null>(null);
  const [showDoneModal, setShowDoneModal] = useState<Aemtli | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meine-wg/${slug}/aemtli`);
      if (!res.ok) return;
      setData((await res.json()) as Data);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadHistory() {
    const res = await fetch(`/api/meine-wg/${slug}/aemtli/history`);
    if (res.ok) setHistory((await res.json()) as HistoryEntry[]);
  }

  async function undoLast(aemtliId: string) {
    if (!confirm("Letzte Erledigung rueckgaengig machen?")) return;
    await fetch(`/api/meine-wg/${slug}/aemtli/${aemtliId}/done`, {
      method: "DELETE",
    });
    load();
    if (showHistory) loadHistory();
  }

  if (loading || !data) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
        <WgPageHeader
          backToWgSlug={slug}
          backToWgName={wgName}
          title="🧹 Aemtli"
        />
        <p className="mt-4 text-sm text-gray-500">Lade...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <WgPageHeader
        backToWgSlug={slug}
        backToWgName={wgName}
        title="🧹 Aemtli"
        subtitle={
          data.members.length === 0
            ? "keine Mitglieder mit Zimmer!"
            : `Rotation ueber ${data.members.length} WG-Member`
        }
      />
      <div className="mb-4 mt-3 flex justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setShowAdd(true);
          }}
          className="rounded-lg border border-white/30 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/15"
        >
          + Aemtli
        </button>
      </div>

      {data.members.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900/30 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            Rotation
          </p>
          <div className="flex flex-wrap gap-1">
            {data.members.map((m, i) => (
              <span
                key={m.id}
                className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 font-mono text-[10px] text-gray-300"
              >
                {i + 1}. {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.aemtli.map((a) => (
          <AemtliCard
            key={a.id}
            a={a}
            onDone={() => setShowDoneModal(a)}
            onEdit={() => {
              setShowAdd(false);
              setEditing(a);
            }}
            onDelete={async () => {
              if (a.mandatory) {
                alert("Verpflichtende Aemtli koennen nicht geloescht werden.");
                return;
              }
              if (!confirm(`"${a.title}" wirklich loeschen?`)) return;
              await fetch(`/api/meine-wg/${slug}/aemtli/${a.id}`, {
                method: "DELETE",
              });
              load();
            }}
            onUndo={() => undoLast(a.id)}
          />
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => {
            const next = !showHistory;
            setShowHistory(next);
            if (next && !history) loadHistory();
          }}
          className="mb-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-gray-500 hover:text-accent"
        >
          {showHistory ? "▼" : "▶"} Historie
        </button>
        {showHistory && history && (
          <div className="space-y-1">
            {history.length === 0 ? (
              <p className="py-3 text-center text-xs italic text-gray-600">
                noch keine Erledigungen
              </p>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-gray-800 bg-gray-900/30 p-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white">{h.aemtli.title}</span>
                    <span className="text-[10px] text-gray-500">
                      {fmtDateTime(h.doneAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    von <span className="text-accent">{h.user.name}</span>
                    {h.notes && <span className="text-gray-500"> · {h.notes}</span>}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <AemtliModal
          slug={slug}
          editing={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowAdd(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {showDoneModal && (
        <DoneModal
          slug={slug}
          aemtli={showDoneModal}
          members={data.members}
          onClose={() => setShowDoneModal(null)}
          onSaved={() => {
            setShowDoneModal(null);
            load();
            if (showHistory) loadHistory();
          }}
        />
      )}
    </div>
  );
}

function AemtliCard({
  a,
  onDone,
  onEdit,
  onDelete,
  onUndo,
}: {
  a: Aemtli;
  onDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUndo: () => void;
}) {
  const isOverdue = a.overdueDays > 0;
  return (
    <div
      className={`rounded-xl border p-3 ${
        isOverdue
          ? "border-red-500/40 bg-red-500/5"
          : "border-gray-800 bg-gray-900/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="font-medium text-white">{a.title}</p>
            {a.mandatory && (
              <span className="rounded bg-secondary/20 px-1 font-mono text-[8px] uppercase text-secondary">
                Pflicht
              </span>
            )}
          </div>
          {a.description && (
            <p className="mt-0.5 text-[11px] text-gray-500">{a.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 hover:text-white"
            title="Bearbeiten"
          >
            ✎
          </button>
          {!a.mandatory && (
            <button
              onClick={onDelete}
              className="text-xs text-gray-500 hover:text-red-400"
              title="Loeschen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 text-[11px]">
          <p className="text-gray-400">
            zuletzt:{" "}
            <span className="text-gray-200">
              {a.lastDoneBy?.name ?? "—"}
            </span>
            <span className="text-gray-500"> · {fmtDate(a.lastDoneAt)}</span>
          </p>
          {a.nextMember && (
            <p className="text-gray-400">
              naechste*r:{" "}
              <span className="text-accent">{a.nextMember.name}</span>{" "}
              <span className="text-gray-600">
                (alle {a.intervalDays} Tage)
              </span>
            </p>
          )}
        </div>
        <button
          onClick={onDone}
          className="rounded-md bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:brightness-110"
        >
          ✓ erledigt
        </button>
      </div>

      {isOverdue && (
        <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-200">
          {overdueRoast(a.overdueDays, a.title)}
        </div>
      )}

      {a.lastDoneAt && (
        <button
          onClick={onUndo}
          className="mt-2 text-[10px] text-gray-600 hover:text-gray-400"
        >
          ↺ letzte rueckgaengig
        </button>
      )}
    </div>
  );
}

function AemtliModal({
  slug,
  editing,
  onClose,
  onSaved,
}: {
  slug: string;
  editing: Aemtli | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [intervalDays, setIntervalDays] = useState(editing?.intervalDays ?? 7);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const url = editing
        ? `/api/meine-wg/${slug}/aemtli/${editing.id}`
        : `/api/meine-wg/${slug}/aemtli`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          intervalDays,
        }),
      });
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? "Aemtli bearbeiten" : "Neues Aemtli"}
      onClose={onClose}
    >
      <Field label="Titel">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>
      <Field label="Beschreibung (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>
      <Field label={`Intervall: alle ${intervalDays} Tage`}>
        <input
          type="range"
          min={1}
          max={60}
          value={intervalDays}
          onChange={(e) => setIntervalDays(parseInt(e.target.value, 10))}
          className="w-full accent-accent"
        />
      </Field>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy || !title.trim()}
          className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "..." : editing ? "Speichern" : "Anlegen"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
        >
          Abbrechen
        </button>
      </div>
    </Modal>
  );
}

function DoneModal({
  slug,
  aemtli,
  members,
  onClose,
  onSaved,
}: {
  slug: string;
  aemtli: Aemtli;
  members: Person[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [userId, setUserId] = useState(aemtli.nextMember?.id ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/meine-wg/${slug}/aemtli/${aemtli.id}/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || undefined, notes: notes || null }),
      });
      if (res.ok) onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Erledigt: ${aemtli.title}`} onClose={onClose}>
      <Field label="Wer hat's gemacht?">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.id === aemtli.nextMember?.id && " (← naechste*r)"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notiz (optional)">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
        />
      </Field>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy || !userId}
          className="flex-1 rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-50"
        >
          ✓ Erledigt
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400"
        >
          Abbrechen
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-cinzel text-lg text-accent">{title}</h2>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
