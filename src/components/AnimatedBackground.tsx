"use client";

import { useRef, type CSSProperties } from "react";

interface AnimatedBackgroundProps {
  icon?: string;
  glowClass?: string;
  showIcon?: boolean;
  scrollable?: boolean;
}

// Vorgenerierte Partikel-Positionen (fix, damit Server/Client matchen)
// blur-Varianten fuer unterschiedliche Weichheit
// Delays sind negativ/klein, damit die Partikel sofort sichtbar sind
const PARTICLES = [
  { left: "10%", top: "85%", anim: "a", duration: 16, delay: -2, blur: "blur-soft" },
  { left: "25%", top: "92%", anim: "b", duration: 22, delay: -5, blur: "blur-heavy" },
  { left: "45%", top: "80%", anim: "c", duration: 18, delay: -8, blur: "" },
  { left: "65%", top: "90%", anim: "d", duration: 24, delay: -3, blur: "blur-soft" },
  { left: "80%", top: "85%", anim: "a", duration: 17, delay: -10, blur: "blur-sharp" },
  { left: "92%", top: "70%", anim: "b", duration: 20, delay: -6, blur: "blur-heavy" },
  { left: "15%", top: "60%", anim: "c", duration: 23, delay: -12, blur: "blur-soft" },
  { left: "38%", top: "55%", anim: "d", duration: 18, delay: -4, blur: "" },
  { left: "58%", top: "65%", anim: "a", duration: 21, delay: -14, blur: "blur-heavy" },
  { left: "78%", top: "50%", anim: "b", duration: 16, delay: -7, blur: "blur-sharp" },
  { left: "20%", top: "40%", anim: "c", duration: 25, delay: -1, blur: "blur-soft" },
  { left: "50%", top: "35%", anim: "d", duration: 19, delay: -9, blur: "" },
  { left: "85%", top: "30%", anim: "a", duration: 22, delay: -5, blur: "blur-heavy" },
  { left: "30%", top: "20%", anim: "b", duration: 17, delay: -11, blur: "blur-sharp" },
  { left: "70%", top: "15%", anim: "c", duration: 20, delay: -2, blur: "blur-soft" },
];

export function AnimatedBackground({
  icon = "/pyramid.webp",
  glowClass = "",
  showIcon = true,
  scrollable = false,
}: AnimatedBackgroundProps) {
  // Triple-Tap-Detection auf dem Tab-Icon: 3× innerhalb 1.5s feuert
  // ein "via1:rave-trigger"-CustomEvent ab. HomeScreen lauscht darauf.
  const tapTimes = useRef<number[]>([]);
  function handleIconTap(e: React.MouseEvent) {
    e.stopPropagation();
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter(
      (t) => now - t < 1500
    );
    if (tapTimes.current.length >= 3) {
      tapTimes.current = [];
      window.dispatchEvent(new CustomEvent("via1:rave-trigger"));
    }
  }

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
      {/* Unsichtbarer Click-Hotspot exakt ueber dem Tab-Icon — der img
         selber sitzt in einem z-index:-1 Layer und ist nicht klickbar. */}
      {showIcon && (
        <button
          type="button"
          onClick={handleIconTap}
          aria-label="Tab-Icon"
          className="absolute left-1/2 top-[10px] z-10 h-40 w-40 -translate-x-1/2 cursor-pointer rounded-full bg-transparent"
          style={{ touchAction: "manipulation" }}
        />
      )}
    </>
  );
}
