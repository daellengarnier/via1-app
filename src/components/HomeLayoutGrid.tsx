"use client";

import type { ReactNode } from "react";
import {
  HOME_BLOCK_LABELS,
  LIST_COUNTS,
  type HomeBlockId,
  type HomeLayout,
  type ListCount,
} from "@/lib/home-layout";

export type BlockSize = "half" | "third" | "full";

export interface HomeBlockDef {
  size: BlockSize;
  render: () => ReactNode;
  // false = fuer diese Person nicht verfuegbar (z.B. Kaffee ohne Abo);
  // taucht dann weder in der Ansicht noch im Bearbeiten-Modus auf.
  available?: boolean;
}

interface Props {
  layout: HomeLayout;
  blocks: Partial<Record<HomeBlockId, HomeBlockDef>>;
  editMode: boolean;
  onChange: (next: HomeLayout) => void;
}

const CAP: Record<BlockSize, number> = { half: 2, third: 3, full: 1 };

// Rendert die Bloecke in der gespeicherten Reihenfolge. Aufeinander-
// folgende gleich grosse Bloecke teilen sich eine Zeile (2 halbe, 3
// drittel); ein uebrig bleibender Block fuellt seine Zeile allein.
// Im Bearbeiten-Modus bekommt jeder Block eine kleine Leiste mit
// Verschieben/Ausblenden, unten erscheinen die ausgeblendeten Bloecke.
export function HomeLayoutGrid({ layout, blocks, editMode, onChange }: Props) {
  const usable = (id: HomeBlockId) =>
    !!blocks[id] && blocks[id]!.available !== false;
  const visible = layout.order.filter(
    (id) => usable(id) && !layout.hidden.includes(id)
  );
  const hiddenIds = layout.order.filter(
    (id) => usable(id) && layout.hidden.includes(id)
  );

  const rows: { ids: HomeBlockId[]; size: BlockSize }[] = [];
  for (const id of visible) {
    const size = blocks[id]!.size;
    const last = rows[rows.length - 1];
    if (
      last &&
      last.size === size &&
      size !== "full" &&
      last.ids.length < CAP[size]
    ) {
      last.ids.push(id);
    } else {
      rows.push({ ids: [id], size });
    }
  }

  function move(id: HomeBlockId, dir: -1 | 1) {
    const idx = visible.indexOf(id);
    const target = visible[idx + dir];
    if (!target) return;
    const order = layout.order.filter((x) => x !== id);
    const targetIdx = order.indexOf(target);
    order.splice(dir < 0 ? targetIdx : targetIdx + 1, 0, id);
    onChange({ ...layout, order });
  }

  function hide(id: HomeBlockId) {
    onChange({ ...layout, hidden: [...layout.hidden, id] });
  }

  function show(id: HomeBlockId) {
    // Beim Einblenden ans Ende der sichtbaren Bloecke haengen.
    const order = layout.order.filter((x) => x !== id);
    order.push(id);
    onChange({
      ...layout,
      order,
      hidden: layout.hidden.filter((x) => x !== id),
    });
  }

  function setCount(id: "termin" | "aktivitaet", count: ListCount) {
    onChange(
      id === "termin"
        ? { ...layout, termineCount: count }
        : { ...layout, aktivitaetenCount: count }
    );
  }

  function frame(id: HomeBlockId, node: ReactNode) {
    if (!editMode) return node;
    const idx = visible.indexOf(id);
    const countable = id === "termin" || id === "aktivitaet";
    const count = id === "termin" ? layout.termineCount : layout.aktivitaetenCount;
    return (
      <div className="mb-3 rounded-2xl border border-dashed border-accent/40 p-1">
        <div className="pointer-events-none opacity-80">{node}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1 rounded-md bg-black/70 px-1.5 py-1">
          <span className="mr-auto truncate font-mono text-[9px] uppercase tracking-wider text-gray-400">
            {HOME_BLOCK_LABELS[id]}
          </span>
          {countable && (
            <span className="flex items-center gap-0.5">
              {LIST_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(id, c)}
                  className={`h-6 w-6 rounded font-mono text-[10px] font-bold ${
                    count === c
                      ? "bg-accent text-dark"
                      : "border border-gray-700 text-gray-400"
                  }`}
                  title={`${c} anzeigen`}
                >
                  {c}
                </button>
              ))}
            </span>
          )}
          <button
            type="button"
            onClick={() => move(id, -1)}
            disabled={idx <= 0}
            className="h-6 w-6 rounded border border-gray-700 text-xs text-gray-300 disabled:opacity-30"
            aria-label="Nach oben"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => move(id, 1)}
            disabled={idx >= visible.length - 1}
            className="h-6 w-6 rounded border border-gray-700 text-xs text-gray-300 disabled:opacity-30"
            aria-label="Nach unten"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => hide(id)}
            className="h-6 w-6 rounded border border-gray-700 text-xs text-gray-300"
            aria-label="Ausblenden"
            title="Ausblenden"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {rows.map((row, i) =>
        row.size === "full" ? (
          <div key={`${row.ids[0]}-${i}`}>
            {frame(row.ids[0]!, blocks[row.ids[0]!]!.render())}
          </div>
        ) : (
          <div
            key={`${row.ids.join("+")}-${i}`}
            className={`mb-4 grid gap-3 ${
              row.ids.length === 1
                ? "grid-cols-1"
                : row.ids.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {row.ids.map((id) => (
              <div key={id} className="min-w-0">
                {frame(id, blocks[id]!.render())}
              </div>
            ))}
          </div>
        )
      )}

      {editMode && (
        <div className="mb-5 rounded-lg border border-dashed border-gray-700 bg-black/30 p-3">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-gray-500">
            Ausgeblendet — tippen zum Einblenden
          </p>
          {hiddenIds.length === 0 ? (
            <p className="text-xs text-gray-600">Alles sichtbar.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {hiddenIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => show(id)}
                  className="rounded-full border border-gray-700 px-3 py-1 font-mono text-[10px] text-gray-300 hover:border-accent hover:text-white"
                >
                  + {HOME_BLOCK_LABELS[id]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
