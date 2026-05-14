"use client";

import { useEffect, useMemo } from "react";

const RAVE_DURATION_MS = 6000;

const COLORS = [
  "#ef4444", // rot
  "#f97316", // orange
  "#facc15", // gelb
  "#22c55e", // gruen
  "#06b6d4", // cyan
  "#3b82f6", // blau
  "#a855f7", // violett
  "#ec4899", // pink
];

interface ConfettiPiece {
  id: number;
  left: number; // % horizontal Startposition (Pyramide ~50%)
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
  driftX: number;
}

interface ShootingStarConfig {
  id: number;
  topPercent: number;
  delay: number;
  duration: number;
  rotate: number;
  // Trajektorien-Parameter (alles in vw, damit der Schweif gerade ist)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface LightningConfig {
  id: number;
  delay: number; // Sekunden
  // Position des Blitzes (zufaellig auf dem Screen verteilt)
  leftPercent: number;
  // Skalierung (manche grosse, manche kleine)
  scale: number;
  // Farbe (meistens weiss, manchmal cyan/violett fuer Effekt)
  color: string;
}

function buildConfetti(count = 120): ConfettiPiece[] {
  const out: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: i,
      left: 50 + (Math.random() - 0.5) * 30, // ueberwiegend aus Pyramide-Mitte
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      color: COLORS[i % COLORS.length]!,
      rotate: Math.random() * 720 - 360,
      size: 6 + Math.random() * 8,
      driftX: (Math.random() - 0.5) * 80, // vw, weite seitliche Streuung
    });
  }
  return out;
}

function buildLightning(count = 18): LightningConfig[] {
  const colors = [
    "#ffffff",
    "#ffffff",
    "#ffffff", // weiss dominiert
    "#a5f3fc", // cyan
    "#e9d5ff", // violett-hell
    "#fef08a", // gelb-hell
  ];
  const out: LightningConfig[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: i,
      delay: Math.random() * (RAVE_DURATION_MS / 1000) * 0.95,
      leftPercent: 5 + Math.random() * 90,
      scale: 0.6 + Math.random() * 1.4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    });
  }
  return out;
}

function buildStars(count = 50): ShootingStarConfig[] {
  const out: ShootingStarConfig[] = [];
  for (let i = 0; i < count; i++) {
    // Zufaelliger Winkel (-25° bis +35°), aber konsistent: dy = dx * tan
    const angleDeg = -25 + Math.random() * 60;
    const angleRad = (angleDeg * Math.PI) / 180;
    const dx = 130; // vw horizontal
    const dy = dx * Math.tan(angleRad);
    // Direction: meistens links→rechts, ab und zu rechts→links
    const reverse = Math.random() < 0.25;
    const fromX = reverse ? 115 : -15;
    const toX = reverse ? -15 : 115;
    const startY = Math.random() * 100; // vh, ueber die ganze Hoehe verteilt
    const realRotate = reverse ? 180 - angleDeg : angleDeg;

    out.push({
      id: i,
      topPercent: 0,
      delay: Math.random() * RAVE_DURATION_MS / 1000 * 0.8,
      duration: 0.6 + Math.random() * 0.6,
      rotate: realRotate,
      fromX,
      fromY: startY * 0.5, // skaliert
      toX,
      toY: startY * 0.5 + (reverse ? -dy : dy),
    });
  }
  return out;
}

// Massive Rave-Overlay: 120 Konfetti-Stueck + 50 Sternschnuppen +
// pulsierende Tiles + Strobe-Background. Selbst-zerstoert sich nach
// RAVE_DURATION_MS.
export function RaveOverlay({ onDone }: { onDone: () => void }) {
  const confetti = useMemo(() => buildConfetti(), []);
  const stars = useMemo(() => buildStars(), []);
  const lightning = useMemo(() => buildLightning(), []);

  useEffect(() => {
    document.body.classList.add("via1-rave-active");
    const t = window.setTimeout(() => {
      document.body.classList.remove("via1-rave-active");
      onDone();
    }, RAVE_DURATION_MS);
    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("via1-rave-active");
    };
  }, [onDone]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {/* Strobe-Background: schnelle Farbblitze */}
      <div className="rave-strobe absolute inset-0" />

      {/* Konfetti-Schauer aus der Pyramide */}
      {confetti.map((c) => (
        <span
          key={c.id}
          className="rave-confetti absolute top-[110px]"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            background: c.color,
            // Custom CSS variables fuer Animation
            ["--drift-x" as string]: `${c.driftX}vw`,
            ["--rotate-end" as string]: `${c.rotate}deg`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        />
      ))}

      {/* Sternschnuppen-Sturm */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="rave-shooting-star absolute"
          style={{
            ["--from-x" as string]: `${s.fromX}vw`,
            ["--from-y" as string]: `${s.fromY}vw`,
            ["--to-x" as string]: `${s.toX}vw`,
            ["--to-y" as string]: `${s.toY}vw`,
            ["--rotate" as string]: `${s.rotate}deg`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Donnerblitze ⚡ — zackige SVGs blitzen kurz auf, dazu Vollbild-Flash */}
      {lightning.map((l) => (
        <svg
          key={l.id}
          viewBox="0 0 24 80"
          className="rave-lightning absolute top-0"
          style={{
            left: `${l.leftPercent}%`,
            width: `${l.scale * 60}px`,
            height: `${l.scale * 200}px`,
            color: l.color,
            animationDelay: `${l.delay}s`,
          }}
        >
          <path
            d="M 14 0 L 4 36 L 12 36 L 6 80 L 22 30 L 14 30 Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="0.6"
          />
        </svg>
      ))}
      {/* Vollbild-Flash bei jedem Blitz: kurzer weisser Stoss */}
      <div className="rave-screen-flash absolute inset-0" />
    </div>
  );
}
