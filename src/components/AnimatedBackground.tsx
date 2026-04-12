"use client";

import type { CSSProperties } from "react";

interface AnimatedBackgroundProps {
  icon?: string;
  glowClass?: string;
}

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
}: AnimatedBackgroundProps) {
  const colorMap: Record<string, string> = {
    "glow-orange": "255, 140, 30",
    "glow-blue": "50, 150, 255",
    "glow-red": "255, 70, 50",
    "glow-yellow": "255, 220, 50",
  };
  const rgb = glowClass ? colorMap[glowClass] : "0, 255, 100";
  const c = rgb || "0, 255, 100";

  // CSS custom property for glow color
  const bgStyle = {
    "--glow-rgb": c,
  } as CSSProperties;

  return (
    <div className="via-bg" aria-hidden="true" style={bgStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        className={`via-tab-icon ${glowClass}`}
        loading="eager"
      />
      <div className="via-glow via-glow-1" />
      <div className="via-glow via-glow-2" />
      <div className="via-glow via-glow-3" />
    </div>
  );
}
