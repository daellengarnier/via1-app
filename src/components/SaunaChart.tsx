"use client";

import { useEffect, useState } from "react";

interface Point {
  t: string;
  top: number | null;
  // Relative Luftfeuchte in %. Fehlt bei alten Messwerten (ESP32 ohne Feuchte).
  humidity?: number | null;
}

interface Props {
  hours?: number;
  className?: string;
}

type Pt = { x: number; y: number };

// Glaette eine Polyline via Catmull-Rom -> Cubic Bezier (smooth flow chart look)
function smoothPath(points: Pt[]): string {
  const first = points[0];
  if (!first || points.length < 2) return "";
  const second = points[1]!;
  if (points.length === 2) {
    return `M${first.x},${first.y} L${second.x},${second.y}`;
  }
  const d: string[] = [`M${first.x},${first.y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p0 = points[i - 1] ?? p1;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`);
  }
  return d.join(" ");
}

export function SaunaChart({ hours = 2, className = "" }: Props) {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sauna/history?hours=${hours}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { points: Point[] };
        if (!cancelled) setPoints(data.points);
      } catch {
        // silent
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hours]);

  if (points === null) {
    return (
      <div className={`h-48 animate-pulse rounded-xl bg-white/5 ${className}`} />
    );
  }

  if (points.length < 2) {
    return (
      <div
        className={`flex h-48 items-center justify-center rounded-xl border border-gray-800 bg-white/5 text-xs text-gray-500 ${className}`}
      >
        Noch zu wenig Daten für Verlauf
      </div>
    );
  }

  // Y-Achse (links, °C): dynamisch zwischen 0..max(Temperatur) mit ein bisschen padding.
  // Die Feuchte zaehlt hier bewusst NICHT mit: Sie hat eine eigene, feste Skala 0..100 %
  // (rechts). Prozent und Grad auf derselben Achse wuerden so aussehen, als waeren
  // "40" Grad und "40" Prozent dasselbe.
  const allVals = points
    .map((p) => p.top)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const maxV = Math.max(100, Math.ceil(Math.max(...allVals, 25) / 10) * 10 + 5);
  const minV = Math.min(0, Math.floor(Math.min(...allVals, 15) / 10) * 10);

  const W = 400;
  const H = 180;
  const PAD_L = 32;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 24;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xFor = (i: number) =>
    PAD_L + (i / (points.length - 1)) * innerW;
  const yFor = (v: number) =>
    PAD_T + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const topPts = points
    .map((p, i) =>
      typeof p.top === "number" ? { x: xFor(i), y: yFor(p.top) } : null
    )
    .filter((p): p is { x: number; y: number } => p !== null);
  // Feuchte: feste Skala 0 % (unten) bis 100 % (oben) ueber die ganze Hoehe.
  const yForHum = (v: number) =>
    PAD_T + innerH - (Math.min(100, Math.max(0, v)) / 100) * innerH;
  const humPts = points
    .map((p, i) =>
      typeof p.humidity === "number"
        ? { x: xFor(i), y: yForHum(p.humidity) }
        : null
    )
    .filter((p): p is { x: number; y: number } => p !== null);

  const topPath = smoothPath(topPts);
  const humPath = smoothPath(humPts);

  // Area unter der Kurve (zur baseline = Y-Achse von minV)
  const baseY = yFor(minV);
  const topArea =
    topPts.length >= 2
      ? `${topPath} L${topPts[topPts.length - 1]!.x},${baseY} L${topPts[0]!.x},${baseY} Z`
      : "";

  // Zeit-Labels (Start / Mitte / Ende)
  const fmtT = (iso: string) =>
    new Date(iso).toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const tStart = fmtT(points[0]!.t);
  const tEnd = fmtT(points[points.length - 1]!.t);

  // Y-Achse Ticks (3 stueck)
  const ticks = [minV, Math.round((minV + maxV) / 2), maxV];

  const lastTop =
    points
      .slice()
      .reverse()
      .find((p) => typeof p.top === "number")?.top ?? null;
  const lastHum =
    points
      .slice()
      .reverse()
      .find((p) => typeof p.humidity === "number")?.humidity ?? null;

  return (
    <div className={`rounded-xl border border-gray-800 bg-white/5 p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            TEMP {lastTop !== null && `${lastTop.toFixed(1)}°`}
          </span>
          {/* Legende nur zeigen, wenn es im Zeitraum ueberhaupt Feuchtewerte gibt.
              Sonst stuende "FEUCHTE –" ueber einer Kurve, die es nicht gibt. */}
          {lastHum !== null && (
            <span className="flex items-center gap-1 text-sky-300">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-300" />
              FEUCHTE {Math.round(lastHum)} %
            </span>
          )}
        </div>
        <span className="text-gray-500">{hours}h Verlauf</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(248,113,113)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(248,113,113)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y-Grid */}
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="rgb(75,85,99)"
              strokeOpacity="0.3"
              strokeDasharray="2 3"
            />
            <text
              x={PAD_L - 6}
              y={yFor(v) + 3}
              textAnchor="end"
              fontSize="9"
              fill="rgb(107,114,128)"
            >
              {v}°
            </text>
          </g>
        ))}

        {/* Feuchte zuerst (liegt hinter der Temperatur): duenne gestrichelte Linie ohne
            Flaeche, damit man sie nicht fuer eine zweite Temperatur haelt. Rechts ihre
            eigene Skala in Prozent. */}
        {humPath && (
          <>
            <path
              d={humPath}
              fill="none"
              stroke="rgb(125,211,252)"
              strokeWidth="1.4"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {[0, 50, 100].map((v) => (
              <text
                key={`h${v}`}
                x={W - PAD_R + 3}
                y={yForHum(v) + 3}
                textAnchor="start"
                fontSize="7"
                fill="rgb(125,211,252)"
                fillOpacity="0.7"
              >
                {v}
              </text>
            ))}
          </>
        )}

        {/* Top area + line */}
        {topArea && <path d={topArea} fill="url(#grad-top)" />}
        {topPath && (
          <path
            d={topPath}
            fill="none"
            stroke="rgb(248,113,113)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* X-Achse Labels */}
        <text
          x={PAD_L}
          y={H - 6}
          textAnchor="start"
          fontSize="9"
          fill="rgb(107,114,128)"
        >
          {tStart}
        </text>
        <text
          x={W - PAD_R}
          y={H - 6}
          textAnchor="end"
          fontSize="9"
          fill="rgb(107,114,128)"
        >
          {tEnd}
        </text>
      </svg>
    </div>
  );
}
