"use client";

interface AnimatedBackgroundProps {
  icon?: string; // Pfad zum Icon (z.B. "/pyramid.webp", "/icon-sauna.webp")
  glowClass?: string; // CSS-Klasse für Glow-Farbe (z.B. "glow-orange")
  glowColor?: string; // CSS-Farbe für die Glow-Spots
}

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
  glowColor,
}: AnimatedBackgroundProps) {
  const glowStyle1 = glowColor
    ? { background: glowColor.replace(")", ", 0.08)").replace("rgb", "rgba") }
    : undefined;
  const glowStyle2 = glowColor
    ? { background: glowColor.replace(")", ", 0.06)").replace("rgb", "rgba") }
    : undefined;
  const glowStyle3 = glowColor
    ? { background: glowColor.replace(")", ", 0.05)").replace("rgb", "rgba") }
    : undefined;

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
