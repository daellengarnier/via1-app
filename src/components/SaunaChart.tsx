"use client";

import { useEffect, useState } from "react";

interface Point {
  t: string;
  top: number | null;
  bottom: number | null;
}

interface Props {
  hours?: number;
  className?: string;
}

// Glaette eine Polyline via Catmull-Rom -> Cubic Bezier (smooth flow chart look)
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }
  const d: string[] = [`M${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
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

  // Y-Achse: dynamisch zwischen 0..max(top|bottom) mit ein bisschen padding
  const allVals = points
    .flatMap((p) => [p.top, p.bottom])
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
  const bottomPts = points
    .map((p, i) =>
      typeof p.bottom === "number" ? { x: xFor(i), y: yFor(p.bottom) } : null
    )
    .filter((p): p is { x: number; y: number } => p !== null);

  const topPath = smoothPath(topPts);
  const bottomPath = smoothPath(bottomPts);

  // Area unter der Kurve (zur baseline = Y-Achse von minV)
  const baseY = yFor(minV);
  const topArea =
    topPts.length >= 2
      ? `${topPath} L${topPts[topPts.length - 1].x},${baseY} L${topPts[0].x},${baseY} Z`
      : "";
  const bottomArea =
    bottomPts.length >= 2
      ? `${bottomPath} L${bottomPts[bottomPts.length - 1].x},${baseY} L${bottomPts[0].x},${baseY} Z`
      : "";

  // Zeit-Labels (Start / Mitte / Ende)
  const fmtT = (iso: string) =>
    new Date(iso).toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const tStart = fmtT(points[0].t);
  const tEnd = fmtT(points[points.length - 1].t);

  // Y-Achse Ticks (3 stueck)
  const ticks = [minV, Math.round((minV + maxV) / 2), maxV];

  const lastTop =
    points
      .slice()
      .reverse()
      .find((p) => typeof p.top === "number")?.top ?? null;
  const lastBottom =
    points
      .slice()
      .reverse()
      .find((p) => typeof p.bottom === "number")?.bottom ?? null;

  return (
    <div className={`rounded-xl border border-gray-800 bg-white/5 p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            OBEN {lastTop !== null && `${lastTop.toFixed(1)}°`}
          </span>
          <span className="flex items-center gap-1 text-orange-300">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-300" />
            UNTEN {lastBottom !== null ? `${lastBottom.toFixed(1)}°` : "–"}
          </span>
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
          <linearGradient id="grad-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(253,186,116)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgb(253,186,116)" stopOpacity="0.05" />
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

        {/* Bottom area + line zuerst (damit sie hinter Top liegt) */}
        {bottomArea && <path d={bottomArea} fill="url(#grad-bottom)" />}
        {bottomPath && (
          <path
            d={bottomPath}
            fill="none"
            stroke="rgb(253,186,116)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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

// Kompakte Sparkline fuer die Homescreen-Kachel — nur OBEN-Linie
export function SaunaSparkline() {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/sauna/history?hours=1", {
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
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!points || points.length < 2) return null;

  const tops = points
    .map((p) => p.top)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (tops.length < 2) return null;

  const minV = Math.min(...tops) - 1;
  const maxV = Math.max(...tops) + 1;
  const W = 100;
  const H = 28;

  const pts = points
    .map((p, i) => {
      if (typeof p.top !== "number") return null;
      const x = (i / (points.length - 1)) * W;
      const y = H - ((p.top - minV) / (maxV - minV)) * H;
      return { x, y };
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  const path = smoothPath(pts);
  const area = `${path} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-1 h-6 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(248,113,113)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(248,113,113)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path
        d={path}
        fill="none"
        stroke="rgb(248,113,113)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
