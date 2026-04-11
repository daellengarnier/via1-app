"use client";

import { useRouter } from "next/navigation";

interface WgData {
  slug: string;
  name: string;
  floor: string;
  side: "nord" | "ost";
  rooms: string[];
  issues: number;
}

const wgs: WgData[] = [
  {
    slug: "family-wg",
    name: "Family-WG",
    floor: "2. OG",
    side: "nord",
    rooms: ["N21", "N22", "N23", "N24", "N25"],
    issues: 0,
  },
  {
    slug: "bonzen",
    name: "Bonzen",
    floor: "2. OG",
    side: "ost",
    rooms: ["O21", "O22", "O23", "O24"],
    issues: 1,
  },
  {
    slug: "dreiecksbar",
    name: "Dreiecksbar",
    floor: "1. OG",
    side: "nord",
    rooms: ["N11", "N12", "N13", "N14", "N15"],
    issues: 2,
  },
  {
    slug: "kleenex",
    name: "Kleenex",
    floor: "1. OG",
    side: "ost",
    rooms: ["O11", "O12", "O13", "O14", "O15"],
    issues: 0,
  },
  {
    slug: "nordwind",
    name: "Nordwind",
    floor: "EG",
    side: "nord",
    rooms: ["N01", "N02", "N03", "N04", "N05"],
    issues: 1,
  },
  {
    slug: "ostblock",
    name: "Ostblock",
    floor: "EG",
    side: "ost",
    rooms: ["O01", "O02", "O03", "O04", "O05"],
    issues: 0,
  },
];

function WgBlock({
  wg,
  x,
  y,
  width,
  onClick,
}: {
  wg: WgData;
  x: number;
  y: number;
  width: number;
  onClick: () => void;
}) {
  const isNord = wg.side === "nord";
  const accentColor = isNord ? "#b8f068" : "#ff6b2b";
  const borderColor = isNord ? "#3a5a20" : "#5a3010";
  const roomWidth = Math.floor((width - 30) / wg.rooms.length);

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-label={`${wg.name} - ${wg.floor} ${wg.side === "nord" ? "Nord" : "Ost"}`}
    >
      {/* WG Container */}
      <rect
        x={x}
        y={y}
        width={width}
        height={130}
        fill={isNord ? "#0f1a08" : "#1a0f05"}
        stroke={accentColor}
        strokeWidth={1.5}
        rx={6}
        className="transition-all duration-200"
      />
      {/* Hover-Overlay */}
      <rect
        x={x}
        y={y}
        width={width}
        height={130}
        fill={accentColor}
        opacity={0}
        rx={6}
        className="hover-overlay"
      />

      {/* WG Name */}
      <text
        x={x + 12}
        y={y + 22}
        fill={accentColor}
        fontSize={13}
        fontWeight="bold"
        fontFamily="'Space Mono', monospace"
      >
        {wg.name}
      </text>

      {/* Stockwerk-Label */}
      <text
        x={x + width - 12}
        y={y + 22}
        textAnchor="end"
        fill="#555"
        fontSize={10}
        fontFamily="'Space Mono', monospace"
      >
        {wg.floor} {wg.side === "nord" ? "Nord" : "Ost"}
      </text>

      {/* Issue-Badge */}
      {wg.issues > 0 && (
        <>
          <circle cx={x + width - 16} cy={y + 45} r={10} fill="#ff6b2b" />
          <text
            x={x + width - 16}
            y={y + 49}
            textAnchor="middle"
            fill="white"
            fontSize={11}
            fontWeight="bold"
            fontFamily="'Space Mono', monospace"
          >
            {wg.issues}
          </text>
        </>
      )}

      {/* Zimmer */}
      {wg.rooms.map((room, i) => (
        <g key={room}>
          <rect
            x={x + 12 + i * (roomWidth + 4)}
            y={y + 35}
            width={roomWidth}
            height={78}
            fill="#1a1a1a"
            stroke={borderColor}
            strokeWidth={1}
            rx={3}
          />
          <text
            x={x + 12 + i * (roomWidth + 4) + roomWidth / 2}
            y={y + 58}
            textAnchor="middle"
            fill={accentColor}
            fontSize={11}
            fontWeight="bold"
            fontFamily="'Space Mono', monospace"
          >
            {room}
          </text>
          <text
            x={x + 12 + i * (roomWidth + 4) + roomWidth / 2}
            y={y + 75}
            textAnchor="middle"
            fill="#555"
            fontSize={9}
            fontFamily="'Space Mono', monospace"
          >
            Zi. {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function FloorPlan() {
  const router = useRouter();

  // Layout: Nord links, Ost rechts.
  // Nord-Fluegel ist einen halben Stock TIEFER versetzt als Ost (Hanglage).
  // Reihenfolge von unten nach oben:
  // Nordwind, Ostblock, Dreiecksbar, Kleenex, Family-WG, Bonzen
  const nordX = 10;
  const ostX = 215;
  const blockW = 185;
  const floorH = 145;
  const nordOffset = floorH / 2; // Nord einen halben Stock tiefer

  const nordWgs = wgs.filter((w) => w.side === "nord");
  const ostWgs = wgs.filter((w) => w.side === "ost");

  const totalHeight = 3 * floorH + nordOffset + 60;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-heading text-2xl text-white">via1</h1>
        <p className="text-sm text-gray-400">Spinnereiweg 17, Bern</p>
      </div>

      {/* SVG Stockwerkplan */}
      <div className="px-2">
        <svg
          viewBox={`0 0 410 ${totalHeight}`}
          className="w-full"
          style={{ maxHeight: "70vh" }}
          fontFamily="'Space Mono', monospace"
        >
          <style>{`
            g[role="button"]:hover rect:first-child {
              stroke-width: 2.5;
              filter: brightness(1.3);
            }
            g[role="button"]:active rect:first-child {
              filter: brightness(1.5);
            }
          `}</style>

          {/* Treppenhaus / Pyramide Platzhalter */}
          <rect
            x={blockW + 14}
            y={5}
            width={16}
            height={totalHeight - 50}
            fill="#151515"
            stroke="#333"
            strokeWidth={1}
            rx={3}
          />

          {/* Nord (links, einen halben Stock tiefer) — von oben: 2.OG, 1.OG, EG */}
          {nordWgs.map((wg, i) => (
            <WgBlock
              key={wg.slug}
              wg={wg}
              x={nordX}
              y={10 + nordOffset + i * floorH}
              width={blockW}
              onClick={() => router.push(`/wg/${wg.slug}`)}
            />
          ))}

          {/* Ost (rechts, hoeher) — von oben: 2.OG, 1.OG, EG */}
          {ostWgs.map((wg, i) => (
            <WgBlock
              key={wg.slug}
              wg={wg}
              x={ostX}
              y={10 + i * floorH}
              width={blockW}
              onClick={() => router.push(`/wg/${wg.slug}`)}
            />
          ))}

          {/* Legende */}
          <g transform={`translate(10, ${totalHeight - 30})`}>
            <rect x={0} y={0} width={8} height={8} fill="#b8f068" rx={2} />
            <text x={12} y={7} fill="#666" fontSize={9}>
              Nord
            </text>
            <rect x={50} y={0} width={8} height={8} fill="#ff6b2b" rx={2} />
            <text x={62} y={7} fill="#666" fontSize={9}>
              Ost
            </text>
            <circle cx={115} cy={4} r={6} fill="#ff6b2b" />
            <text x={125} y={7} fill="#666" fontSize={9}>
              Offene Meldungen
            </text>
          </g>
        </svg>
      </div>

      {/* Quick-Info Widgets unter dem Plan */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Sauna
          </p>
          <p className="font-mono text-2xl font-bold text-accent">62°C</p>
          <p className="text-xs text-gray-500">Wird geheizt</p>
        </div>
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Aufgaben
          </p>
          <p className="font-mono text-2xl font-bold text-secondary">3</p>
          <p className="text-xs text-gray-500">offen</p>
        </div>
      </div>
    </div>
  );
}
