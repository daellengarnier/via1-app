"use client";

interface AnimatedBackgroundProps {
  icon?: string; // Pfad zum Icon (z.B. "/pyramid.webp", "/icon-sauna.webp")
  glowClass?: string; // CSS-Klasse für Glow-Farbe (z.B. "glow-orange")
}

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
}: AnimatedBackgroundProps) {
  const colorMap: Record<string, string> = {
    "glow-orange": "255, 150, 50",
    "glow-cyan": "50, 200, 255",
    "glow-red": "255, 80, 50",
    "glow-violet": "150, 100, 255",
    "glow-amber": "255, 200, 50",
  };
  const rgb = glowClass ? colorMap[glowClass] : "0, 255, 100";
  const c = rgb || "0, 255, 100";
  const glowStyle1 = { background: `rgba(${c}, 0.08)` };
  const glowStyle2 = { background: `rgba(${c}, 0.06)` };
  const glowStyle3 = { background: `rgba(${c}, 0.05)` };

  return (
    <div className="via-bg" aria-hidden="true">
      {/* Tab-Icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        className={`via-tab-icon ${glowClass}`}
        loading="eager"
      />

      {/* Glow-Spots */}
      <div className="via-glow via-glow-1" style={glowStyle1} />
      <div className="via-glow via-glow-2" style={glowStyle2} />
      <div className="via-glow via-glow-3" style={glowStyle3} />
    </div>
  );
}
