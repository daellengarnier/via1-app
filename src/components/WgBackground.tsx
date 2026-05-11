"use client";

import type { CSSProperties } from "react";

// Pure white-particle background fuer den "Meine WG"-Bereich.
// 50 schwebende Partikel + gelegentlich vorbeisausende Sternschnuppen
// (geblurrt) auf schwarzem Grund.

const PARTICLES = [
  // Linke Seite
  { left: "3%",  top: "8%",  anim: "a", duration: 17, delay: -3,  blur: "blur-sharp" },
  { left: "7%",  top: "20%", anim: "b", duration: 21, delay: -7,  blur: "blur-soft" },
  { left: "5%",  top: "32%", anim: "c", duration: 19, delay: -10, blur: "" },
  { left: "11%", top: "44%", anim: "d", duration: 24, delay: -2,  blur: "blur-heavy" },
  { left: "8%",  top: "56%", anim: "a", duration: 18, delay: -14, blur: "blur-soft" },
  { left: "13%", top: "68%", anim: "b", duration: 22, delay: -5,  blur: "blur-sharp" },
  { left: "6%",  top: "80%", anim: "c", duration: 20, delay: -11, blur: "blur-heavy" },
  { left: "10%", top: "92%", anim: "d", duration: 16, delay: -1,  blur: "" },
  // Linke Mitte
  { left: "18%", top: "12%", anim: "a", duration: 25, delay: -8,  blur: "blur-soft" },
  { left: "22%", top: "26%", anim: "b", duration: 18, delay: -4,  blur: "blur-sharp" },
  { left: "16%", top: "38%", anim: "c", duration: 23, delay: -13, blur: "blur-heavy" },
  { left: "24%", top: "50%", anim: "d", duration: 19, delay: -6,  blur: "blur-soft" },
  { left: "20%", top: "62%", anim: "a", duration: 21, delay: -12, blur: "" },
  { left: "26%", top: "74%", anim: "b", duration: 17, delay: -3,  blur: "blur-heavy" },
  { left: "18%", top: "86%", anim: "c", duration: 24, delay: -9,  blur: "blur-soft" },
  // Mitte
  { left: "32%", top: "5%",  anim: "d", duration: 20, delay: -2,  blur: "blur-sharp" },
  { left: "36%", top: "18%", anim: "a", duration: 18, delay: -15, blur: "" },
  { left: "30%", top: "32%", anim: "b", duration: 22, delay: -7,  blur: "blur-soft" },
  { left: "38%", top: "46%", anim: "c", duration: 19, delay: -11, blur: "blur-heavy" },
  { left: "34%", top: "60%", anim: "d", duration: 25, delay: -1,  blur: "blur-sharp" },
  { left: "40%", top: "74%", anim: "a", duration: 17, delay: -8,  blur: "" },
  { left: "32%", top: "88%", anim: "b", duration: 23, delay: -4,  blur: "blur-soft" },
  // Mittlere Mitte
  { left: "46%", top: "10%", anim: "c", duration: 20, delay: -13, blur: "blur-heavy" },
  { left: "50%", top: "24%", anim: "d", duration: 16, delay: -5,  blur: "blur-soft" },
  { left: "44%", top: "40%", anim: "a", duration: 24, delay: -10, blur: "blur-sharp" },
  { left: "52%", top: "56%", anim: "b", duration: 18, delay: -2,  blur: "" },
  { left: "48%", top: "70%", anim: "c", duration: 21, delay: -6,  blur: "blur-heavy" },
  { left: "54%", top: "84%", anim: "d", duration: 19, delay: -12, blur: "blur-soft" },
  // Rechte Mitte
  { left: "58%", top: "6%",  anim: "a", duration: 22, delay: -9,  blur: "" },
  { left: "62%", top: "20%", anim: "b", duration: 20, delay: -14, blur: "blur-sharp" },
  { left: "56%", top: "34%", anim: "c", duration: 17, delay: -3,  blur: "blur-soft" },
  { left: "64%", top: "48%", anim: "d", duration: 23, delay: -7,  blur: "blur-heavy" },
  { left: "60%", top: "62%", anim: "a", duration: 25, delay: -11, blur: "" },
  { left: "66%", top: "76%", anim: "b", duration: 19, delay: -1,  blur: "blur-soft" },
  { left: "58%", top: "90%", anim: "c", duration: 21, delay: -8,  blur: "blur-sharp" },
  // Rechte Seite
  { left: "72%", top: "12%", anim: "d", duration: 18, delay: -4,  blur: "blur-heavy" },
  { left: "76%", top: "26%", anim: "a", duration: 22, delay: -13, blur: "blur-soft" },
  { left: "70%", top: "40%", anim: "b", duration: 24, delay: -10, blur: "" },
  { left: "78%", top: "54%", anim: "c", duration: 16, delay: -5,  blur: "blur-sharp" },
  { left: "74%", top: "68%", anim: "d", duration: 20, delay: -2,  blur: "blur-heavy" },
  { left: "80%", top: "82%", anim: "a", duration: 17, delay: -12, blur: "blur-soft" },
  // Ganz rechts
  { left: "84%", top: "4%",  anim: "b", duration: 23, delay: -6,  blur: "" },
  { left: "88%", top: "18%", anim: "c", duration: 19, delay: -14, blur: "blur-sharp" },
  { left: "82%", top: "32%", anim: "d", duration: 25, delay: -1,  blur: "blur-soft" },
  { left: "90%", top: "46%", anim: "a", duration: 18, delay: -11, blur: "blur-heavy" },
  { left: "86%", top: "60%", anim: "b", duration: 21, delay: -7,  blur: "" },
  { left: "92%", top: "74%", anim: "c", duration: 24, delay: -3,  blur: "blur-soft" },
  { left: "88%", top: "88%", anim: "d", duration: 17, delay: -9,  blur: "blur-sharp" },
  { left: "94%", top: "12%", anim: "a", duration: 22, delay: -4,  blur: "blur-heavy" },
  { left: "96%", top: "52%", anim: "b", duration: 20, delay: -13, blur: "" },
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
      {/* Sternschnuppen — eine Mischung aus solo-Streifen und gelegentlichen
         Schauern. Verschiedene Delays sorgen dafuer dass meistens nur 1-2
         gleichzeitig fliegen, aber alle 20-30s ein paar zusammen feuern. */}
      <span className="wg-shooting-star wg-shooting-star-1" />
      <span className="wg-shooting-star wg-shooting-star-2" />
      <span className="wg-shooting-star wg-shooting-star-3" />
      <span className="wg-shooting-star wg-shooting-star-4" />
      <span className="wg-shooting-star wg-shooting-star-5" />
      <span className="wg-shooting-star wg-shooting-star-6" />
      <span className="wg-shooting-star wg-shooting-star-7" />
      <span className="wg-shooting-star wg-shooting-star-8" />
      <span className="wg-shooting-star wg-shooting-star-9" />
      <span className="wg-shooting-star wg-shooting-star-10" />
    </div>
  );
}
