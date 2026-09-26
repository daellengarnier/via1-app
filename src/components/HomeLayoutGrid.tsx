"use client";

import { useRef, useState, type ReactNode } from "react";
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

interface DragState {
  id: HomeBlockId;
  x: number;
  y: number;
  overId: HomeBlockId | null;
  after: boolean;
}

const CAP: Record<BlockSize, number> = { half: 2, third: 3, full: 1 };

// Rendert die Bloecke in der gespeicherten Reihenfolge. Aufeinander-
// folgende gleich grosse Bloecke teilen sich eine Zeile (2 halbe, 3
// drittel); ein uebrig bleibender Block fuellt seine Zeile allein.
//
// Bearbeiten-Modus: jeder Block bekommt eine Leiste mit Griff (Drag &
// Drop ueber Pointer-Events — kein HTML5-DnD, das ist auf iOS unzu-
// verlaessig), ▲ ▼ als Fallback, ✕ zum Ausblenden und bei Terminen/
// Aktivitaeten die Anzahl 1/3/5. Unten die ausgeblendeten Bloecke.
export function HomeLayoutGrid({ layout, blocks, editMode, onChange }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

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
    placeRelative(id, target, dir > 0);
  }

  // id aus der Reihenfolge nehmen und vor/nach target wieder einfuegen.
  function placeRelative(id: HomeBlockId, target: HomeBlockId, after: boolean) {
    if (id === target) return;
    const order = layout.order.filter((x) => x !== id);
    const i = order.indexOf(target);
    if (i < 0) return;
    order.splice(after ? i + 1 : i, 0, id);
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

  // --- Drag & Drop ---
  // Der Block bleibt an Ort und Stelle (leicht ausgegraut), unter dem
  // Finger schwebt nur ein Label. So trifft elementFromPoint immer den
  // Block unter dem Finger, nicht den gezogenen.
  function onHandlePointerDown(id: HomeBlockId, e: React.PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const s: DragState = { id, x: e.clientX, y: e.clientY, overId: null, after: false };
    dragRef.current = s;
    setDrag(s);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest<HTMLElement>("[data-block-id]") ?? null;
    let overId: HomeBlockId | null = null;
    let after = false;
    if (target && target.dataset.blockId && target.dataset.blockId !== d.id) {
      overId = target.dataset.blockId as HomeBlockId;
      const r = target.getBoundingClientRect();
      after = e.clientY > r.top + r.height / 2;
    }
    const next: DragState = { id: d.id, x: e.clientX, y: e.clientY, overId, after };
    dragRef.current = next;
    setDrag(next);

    // Am Bildschirmrand langsam mitscrollen.
    const margin = 90;
    if (e.clientY < margin) window.scrollBy(0, -10);
    else if (e.clientY > window.innerHeight - margin) window.scrollBy(0, 10);
  }

  function onHandlePointerUp() {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (d?.overId) placeRelative(d.id, d.overId, d.after);
  }

  function onHandlePointerCancel() {
    dragRef.current = null;
    setDrag(null);
  }

  function frame(id: HomeBlockId, node: ReactNode) {
    if (!editMode) return node;
    const idx = visible.indexOf(id);
    const countable = id === "termin" || id === "aktivitaet";
    const count = id === "termin" ? layout.termineCount : layout.aktivitaetenCount;
    const isDragging = drag?.id === id;
    const isOver = drag?.overId === id;
    return (
      <div
        data-block-id={id}
        className={`relative mb-3 rounded-2xl border border-dashed p-1 transition-opacity ${
          isOver ? "border-accent" : "border-accent/40"
        } ${isDragging ? "opacity-40" : ""}`}
      >
        {isOver && !drag?.after && (
          <div className="absolute -top-2 left-2 right-2 h-1 rounded-full bg-accent" />
        )}
        {isOver && drag?.after && (
          <div className="absolute -bottom-2 left-2 right-2 h-1 rounded-full bg-accent" />
        )}
        <div className="pointer-events-none opacity-80">{node}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1 rounded-md bg-black/70 px-1.5 py-1">
          <button
            type="button"
            onPointerDown={(e) => onHandlePointerDown(id, e)}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerCancel}
            className="mr-auto flex min-w-0 cursor-grab touch-none select-none items-center gap-1.5 rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-300 active:cursor-grabbing"
            aria-label={`${HOME_BLOCK_LABELS[id]} verschieben`}
          >
            <span className="text-sm leading-none text-accent">⠿</span>
            <span className="truncate">{HOME_BLOCK_LABELS[id]}</span>
          </button>
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

      {drag && (
        <div
          className="pointer-events-none fixed z-[80] rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-dark shadow-lg"
          style={{ left: drag.x + 14, top: drag.y - 16 }}
        >
          ⠿ {HOME_BLOCK_LABELS[drag.id]}
        </div>
      )}
    </>
  );
}
