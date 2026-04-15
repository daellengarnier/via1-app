"use client";

import type { CSSProperties } from "react";

interface AnimatedBackgroundProps {
  icon?: string;
  glowClass?: string;
  showIcon?: boolean;
}

// Vorgenerierte Partikel-Positionen (fix, damit Server/Client matchen)
const PARTICLES = [
  { left: "10%", top: "85%", anim: "a", duration: 14, delay: 0 },
  { left: "25%", top: "92%", anim: "b", duration: 18, delay: 2 },
  { left: "45%", top: "80%", anim: "c", duration: 16, delay: 4 },
  { left: "65%", top: "90%", anim: "d", duration: 20, delay: 1 },
  { left: "80%", top: "85%", anim: "a", duration: 15, delay: 5 },
  { left: "92%", top: "70%", anim: "b", duration: 17, delay: 3 },
  { left: "15%", top: "60%", anim: "c", duration: 19, delay: 6 },
  { left: "38%", top: "55%", anim: "d", duration: 16, delay: 2 },
  { left: "58%", top: "65%", anim: "a", duration: 18, delay: 7 },
  { left: "78%", top: "50%", anim: "b", duration: 14, delay: 4 },
  { left: "20%", top: "40%", anim: "c", duration: 21, delay: 0 },
  { left: "50%", top: "35%", anim: "d", duration: 17, delay: 5 },
  { left: "85%", top: "30%", anim: "a", duration: 19, delay: 3 },
  { left: "30%", top: "20%", anim: "b", duration: 15, delay: 6 },
  { left: "70%", top: "15%", anim: "c", duration: 18, delay: 1 },
];

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
  showIcon = true,
}: AnimatedBackgroundProps) {
  const colorMap: Record<string, string> = {
    "glow-orange": "255, 140, 30",
    "glow-blue": "50, 150, 255",
    "glow-red": "255, 70, 50",
    "glow-yellow": "255, 220, 50",
    "glow-amber": "180, 120, 60",
    "glow-violet": "150, 100, 255",
    "glow-pink": "255, 100, 180",
    "glow-silver": "200, 210, 220",
    "glow-green": "80, 240, 140",
  };
  const rgb = glowClass ? colorMap[glowClass] : "0, 255, 100";
  const c = rgb || "0, 255, 100";

  // CSS custom property for glow color
  const bgStyle = {
    "--glow-rgb": c,
  } as CSSProperties;

  return (
    <div className="via-bg" aria-hidden="true" style={bgStyle}>
      {showIcon && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={icon}
          alt=""
          className={`via-tab-icon ${glowClass}`}
          loading="eager"
        />
      )}
      <div className="via-glow via-glow-1" />
      <div className="via-glow via-glow-2" />
      <div className="via-glow via-glow-3" />
      <div className="via-glow via-glow-4" />
      {/* Floating glow particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="via-particle"
          style={{
            left: p.left,
            top: p.top,
            animation: `particle-float-${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
