"use client";

import { useState } from "react";
import { REACTION_EMOJIS } from "@/lib/reactions";

interface ReactionSummary {
  emoji: string;
  count: number;
  mine: boolean;
}

interface Props {
  reactions: ReactionSummary[];
  toggleUrl: string; // POST-URL fuer Toggle (z.B. /api/pinnwand/[id]/reactions)
  onChanged?: () => void; // Caller laedt seine Daten neu nach Toggle
  // Optional: gewuenschte Akzent-Farbe (Tailwind class fragment)
  // Default: weiss/grau
  variant?: "default" | "amber" | "violet" | "white";
}

export function ReactionBar({ reactions, toggleUrl, onChanged, variant = "default" }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  // Lokal optimistic state damit Klick sofort reagiert
  const [local, setLocal] = useState<ReactionSummary[] | null>(null);
  const list = local ?? reactions;
  const [pickerOpen, setPickerOpen] = useState(false);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(emoji);
    // Optimistic update
    const next = applyToggle(list, emoji);
    setLocal(next);
    try {
      const res = await fetch(toggleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        // Bei Fehler revert
        setLocal(list);
        return;
      }
      onChanged?.();
    } finally {
      setBusy(null);
      setPickerOpen(false);
    }
  }

  const baseChipClass =
    variant === "amber"
      ? "border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20"
      : variant === "violet"
        ? "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20"
        : variant === "white"
          ? "border-white/30 bg-white/10 hover:bg-white/20"
          : "border-gray-700 bg-gray-900/40 hover:bg-gray-800";

  const activeChipClass =
    variant === "amber"
      ? "border-amber-400 bg-amber-400/30"
      : variant === "violet"
        ? "border-violet-400 bg-violet-500/30"
        : variant === "white"
          ? "border-white bg-white/30"
          : "border-white/50 bg-white/15";

  const unusedEmojis = REACTION_EMOJIS.filter(
    (e) => !list.some((r) => r.emoji === e)
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      {list.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle(r.emoji);
          }}
          disabled={busy === r.emoji}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors disabled:opacity-60 ${
            r.mine ? activeChipClass : baseChipClass
          }`}
          title={r.mine ? "Klick um zu entfernen" : "Klick um zu setzen"}
        >
          <span>{r.emoji}</span>
          <span className="font-mono text-[10px] text-gray-200">{r.count}</span>
        </button>
      ))}
      {unusedEmojis.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen((v) => !v);
            }}
            className="inline-flex items-center rounded-full border border-dashed border-gray-700 px-1.5 py-0.5 text-[11px] text-gray-500 hover:border-gray-500 hover:text-gray-300"
            title="Emoji hinzufuegen"
            aria-label="Reaction hinzufuegen"
          >
            +
          </button>
          {pickerOpen && (
            <div
              className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-gray-700 bg-gray-950 px-1.5 py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {unusedEmojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    toggle(e);
                  }}
                  disabled={busy === e}
                  className="rounded-full px-1.5 py-0.5 text-base transition-transform hover:scale-125 disabled:opacity-60"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function applyToggle(
  list: ReactionSummary[],
  emoji: string
): ReactionSummary[] {
  const idx = list.findIndex((r) => r.emoji === emoji);
  if (idx < 0) {
    return [...list, { emoji, count: 1, mine: true }];
  }
  const cur = list[idx]!;
  if (cur.mine) {
    // Remove: count -= 1; wenn 0 → entfernen
    if (cur.count <= 1) return list.filter((_, i) => i !== idx);
    return list.map((r, i) =>
      i === idx ? { ...r, count: r.count - 1, mine: false } : r
    );
  }
  return list.map((r, i) =>
    i === idx ? { ...r, count: r.count + 1, mine: true } : r
  );
}
