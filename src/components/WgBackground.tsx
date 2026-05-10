"use client";

import type { CSSProperties } from "react";

// Pure white-particle background fuer den "Meine WG"-Bereich.
// Keine Glow-Spots, keine Tab-Icons — nur viele fliegende Partikel
// auf schwarzem Grund.

// 30 Partikel-Positionen, fix vorgeneriert damit Server/Client matchen
const PARTICLES = [
  { left: "5%",  top: "8%",  anim: "a", duration: 17, delay: -3,  blur: "blur-sharp" },
  { left: "12%", top: "20%", anim: "b", duration: 21, delay: -7,  blur: "blur-soft" },
  { left: "8%",  top: "38%", anim: "c", duration: 19, delay: -10, blur: "" },
  { left: "16%", top: "54%", anim: "d", duration: 24, delay: -2,  blur: "blur-heavy" },
  { left: "10%", top: "72%", anim: "a", duration: 18, delay: -14, blur: "blur-soft" },
  { left: "6%",  top: "88%", anim: "b", duration: 22, delay: -5,  blur: "blur-sharp" },
  { left: "26%", top: "12%", anim: "c", duration: 20, delay: -11, blur: "blur-heavy" },
  { left: "30%", top: "30%", anim: "d", duration: 16, delay: -1,  blur: "" },
  { left: "22%", top: "48%", anim: "a", duration: 25, delay: -8,  blur: "blur-soft" },
  { left: "32%", top: "66%", anim: "b", duration: 18, delay: -4,  blur: "blur-sharp" },
  { left: "28%", top: "82%", anim: "c", duration: 23, delay: -13, blur: "blur-heavy" },
  { left: "44%", top: "5%",  anim: "d", duration: 19, delay: -6,  blur: "blur-soft" },
  { left: "50%", top: "22%", anim: "a", duration: 21, delay: -12, blur: "" },
  { left: "46%", top: "40%", anim: "b", duration: 17, delay: -3,  blur: "blur-heavy" },
  { left: "54%", top: "58%", anim: "c", duration: 24, delay: -9,  blur: "blur-soft" },
  { left: "48%", top: "76%", anim: "d", duration: 20, delay: -2,  blur: "blur-sharp" },
  { left: "52%", top: "92%", anim: "a", duration: 18, delay: -15, blur: "" },
  { left: "66%", top: "10%", anim: "b", duration: 22, delay: -7,  blur: "blur-soft" },
  { left: "70%", top: "28%", anim: "c", duration: 19, delay: -11, blur: "blur-heavy" },
  { left: "62%", top: "44%", anim: "d", duration: 25, delay: -1,  blur: "blur-sharp" },
  { left: "72%", top: "62%", anim: "a", duration: 17, delay: -8,  blur: "" },
  { left: "68%", top: "80%", anim: "b", duration: 23, delay: -4,  blur: "blur-soft" },
  { left: "84%", top: "6%",  anim: "c", duration: 20, delay: -13, blur: "blur-heavy" },
  { left: "88%", top: "24%", anim: "d", duration: 16, delay: -5,  blur: "blur-soft" },
  { left: "82%", top: "42%", anim: "a", duration: 24, delay: -10, blur: "blur-sharp" },
  { left: "90%", top: "60%", anim: "b", duration: 18, delay: -2,  blur: "" },
  { left: "86%", top: "78%", anim: "c", duration: 21, delay: -6,  blur: "blur-heavy" },
  { left: "94%", top: "94%", anim: "d", duration: 19, delay: -12, blur: "blur-soft" },
  { left: "38%", top: "16%", anim: "a", duration: 22, delay: -9,  blur: "" },
  { left: "60%", top: "50%", anim: "b", duration: 20, delay: -14, blur: "blur-sharp" },
];

export function WgBackground() {
  const bgStyle = {
    "--glow-rgb": "255, 255, 255",
  } as CSSProperties;

  return (
    <div
      className="via-bg"
      aria-hidden="true"
      style={{ ...bgStyle, backgroundColor: "#000000" }}
    >
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
  );
}
