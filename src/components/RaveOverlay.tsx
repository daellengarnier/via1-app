"use client";

import { useEffect, useMemo } from "react";

const RAVE_DURATION_MS = 6000;

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
  const stars = useMemo(() => buildStars(), []);

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

    </div>
  );
}
