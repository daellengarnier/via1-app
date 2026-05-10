"use client";

import { useState } from "react";
import { COOKING_PRESETS } from "@/lib/wg-koch-presets";
import {
  DEFAULT_TIME,
  SLOTS,
  SLOT_ICON,
  SLOT_LABEL,
  TIME_PRESETS,
  type Slot,
} from "@/lib/wg-koch-slots";

export interface CookModalEintrag {
  id: string;
  date: string;
  slot: Slot;
  time: string | null;
  menu: string | null;
  description: string | null;
}

export interface CookModalTemplate {
  id: string;
  title: string;
  description: string | null;
  defaultTime: string | null;
}

export interface SlotKey {
  date: string;
  slot: Slot;
}

interface Props {
  slug: string;
  slotKey: SlotKey;
  editing?: CookModalEintrag | null;
  templates: CookModalTemplate[];
  meName: string;
  onClose: () => void;
  onSaved: () => void;
}

// Geteiltes Modal fuers "Ich koche!"-Anlegen + Bearbeiten —
// wird sowohl auf der Kochplan-Subseite als auch im Dashboard verwendet.
export function CookModal({
  slug,
  slotKey,
  editing,
  templates,
  meName,
  onClose,
  onSaved,
}: Props) {
  const [date, setDate] = useState(editing?.date ?? slotKey.date);
  const [slot, setSlot] = useState<Slot>(editing?.slot ?? slotKey.slot);
  const [menu, setMenu] = useState(editing?.menu ?? "");
  const [time, setTime] = useState(
    editing?.time ?? DEFAULT_TIME[slotKey.slot]
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(s: string) {
    setMenu(s);
  }

  function applyTemplate(t: CookModalTemplate) {
    setMenu(t.title);
    if (t.description) setDescription(t.description);
    if (t.defaultTime) setTime(t.defaultTime);
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const url = editing
        ? `/api/meine-wg/${slug}/kochplan/eintraege/${editing.id}`
        : `/api/meine-wg/${slug}/kochplan/eintraege`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          menu: menu.trim() || null,
          time: time || null,
          description: description.trim() || null,
          selfCook: editing ? false : true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Fehler.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  const presets = TIME_PRESETS[slot];
  // Alle Quick-Picks (fest + WG-Vorlagen) in einer Liste fuer einheitliche Optik
  const allQuickPicks = [
    ...COOKING_PRESETS.map((s) => ({ kind: "preset" as const, label: s })),
    ...templates.map((t) => ({
      kind: "template" as const,
      label: t.title,
      template: t,
    })),
  ];

  return (
    <ModalShell
      title={
        editing
          ? "Eintrag bearbeiten"
          : `🍳 ${SLOT_LABEL[slot]} — ${meName} kocht`
      }
      onClose={onClose}
    >
      {editing && (
        <Field label="Slot">
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`rounded-lg py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                  slot === s
                    ? "bg-white text-black"
                    : "border border-gray-700 bg-gray-900 text-gray-400"
                }`}
              >
                {SLOT_ICON[s]} {SLOT_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Menu — was gibt's? (optional)">
        <input
          type="text"
          value={menu}
          onChange={(e) => setMenu(e.target.value)}
          placeholder="z.B. Pasta mit Pesto"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
          autoFocus
        />
        {/* Schnellauswahl: alle in der gleichen Optik (sekundaer-rot/orange),
           egal ob fixe Preset oder eigene Vorlage */}
        <div className="mt-2 flex flex-wrap gap-1">
          {allQuickPicks.map((p, i) => {
            const active = menu === p.label;
            return (
              <button
                key={`${p.kind}-${i}`}
                type="button"
                onClick={() =>
                  p.kind === "preset"
                    ? applyPreset(p.label)
                    : applyTemplate(p.template)
                }
                className={`rounded-full border px-2 py-1 text-xs ${
                  active
                    ? "border-secondary bg-secondary/30 text-white"
                    : "border-secondary/40 bg-secondary/10 text-secondary hover:bg-secondary/20"
                }`}
              >
                {p.kind === "template" ? "⭐ " : ""}
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Zeit">
        <div className="mb-1 flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTime(p)}
              className={`rounded-md border px-2 py-1 font-mono text-xs ${
                time === p
                  ? "border-white/50 bg-white text-black"
                  : "border-gray-700 bg-gray-900 text-gray-300 hover:border-white/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
        />
      </Field>

      <Field label="Datum">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
        />
      </Field>

      <Field label="Notiz / Beschreibung (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none"
          placeholder="z.B. 'bringt jemand Salat?'"
        />
      </Field>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-lg bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black hover:brightness-90 disabled:opacity-50"
        >
          {busy ? "..." : editing ? "Speichern" : "🍳 Los geht's!"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-700 px-4 py-2 font-mono text-xs uppercase text-gray-400 hover:border-gray-500"
        >
          Abbrechen
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white">
            {title}
          </h2>
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
