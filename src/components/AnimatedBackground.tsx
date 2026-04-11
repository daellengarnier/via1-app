"use client";

export function AnimatedBackground() {
  return (
    <div className="via-bg" aria-hidden="true">
      {/* Das Hintergrundbild (public/bg.jpg) wird via CSS geladen */}
      {/* Darüber ein pulsierender Glow-Effekt für das Leuchten */}
      <div className="via-glow-pulse" />
    </div>
  );
}
