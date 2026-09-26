"use client";

import type { CSSProperties } from "react";

interface AnimatedBackgroundProps {
  icon?: string;
  glowClass?: string;
  showIcon?: boolean;
  scrollable?: boolean;
}

// Vorgenerierte Partikel-Positionen (fix, damit Server/Client matchen).
// Bewusst wenige und ohne die schweren Blur-Varianten: jedes geblurrte,
// animierte Element kostet auf Mobile-GPUs spuerbar Scroll-Performance.
const PARTICLES = [
  { left: "10%", top: "85%", anim: "a", duration: 16, delay: -2, blur: "blur-soft" },
  { left: "45%", top: "80%", anim: "c", duration: 18, delay: -8, blur: "" },
  { left: "80%", top: "85%", anim: "a", duration: 17, delay: -10, blur: "blur-sharp" },
  { left: "38%", top: "55%", anim: "d", duration: 18, delay: -4, blur: "" },
  { left: "78%", top: "50%", anim: "b", duration: 16, delay: -7, blur: "blur-sharp" },
  { left: "20%", top: "40%", anim: "c", duration: 25, delay: -1, blur: "blur-soft" },
  { left: "70%", top: "15%", anim: "c", duration: 20, delay: -2, blur: "blur-soft" },
];

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
  showIcon = true,
  scrollable = false,
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
    "glow-white": "255, 255, 255",
  };
  const rgb = glowClass ? colorMap[glowClass] : "0, 255, 100";
  const c = rgb || "0, 255, 100";

  // CSS custom property for glow color
  const bgStyle = {
    "--glow-rgb": c,
  } as CSSProperties;

  return (
    <>
      <div
        className={scrollable ? "via-bg via-bg-scroll" : "via-bg"}
        aria-hidden="true"
        style={bgStyle}
      >
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
            className={`via-particle ${p.blur}`}
            style={{
              left: p.left,
              top: p.top,
              animation: `particle-float-${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}
