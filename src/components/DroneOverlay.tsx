"use client";

import { useEffect } from "react";

// Grobe Sonnenauf-/Sonnenuntergangs-Stunden fuer Bern (47°N), als
// lokale Uhrzeit inkl. DST. Genauigkeit reicht fuer "darf die Drohne
// noch fliegen?" — Livio fliegt eh nicht im Dunkeln.
const SUNRISE_BY_MONTH = [8.0, 7.5, 6.5, 6.5, 5.5, 5.5, 5.5, 6.0, 7.0, 7.5, 7.5, 8.0];
const SUNSET_BY_MONTH  = [17.0, 17.8, 19.0, 20.3, 21.0, 21.5, 21.5, 20.8, 19.8, 18.5, 16.8, 16.5];

export function isDaylight(date: Date = new Date()): boolean {
  const hour = date.getHours() + date.getMinutes() / 60;
  const month = date.getMonth();
  const sunrise = SUNRISE_BY_MONTH[month] ?? 6;
  const sunset = SUNSET_BY_MONTH[month] ?? 20;
  return hour >= sunrise && hour < sunset;
}

// Drohne fliegt in einer Ellipse um den Pyramiden-Spitz, solange aktiv.
// Triggered durch 3-Tap auf die Pyramide (siehe AnimatedBackground).
// Stopp: weiterer 3-Tap (HomeScreen toggled) oder Sonnenuntergang.
// Idee: Livio (12) hat eine Drohne, soll vor dem Fliegen das Haus
// informieren — der Klick auf die Pyramide ist das Signal.
export function DroneOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    document.body.classList.add("via1-drone-active");
    // Jede Minute pruefen ob es noch hell ist; bei Sonnenuntergang
    // automatisch beenden.
    const interval = window.setInterval(() => {
      if (!isDaylight()) {
        onDone();
      }
    }, 60_000);
    return () => {
      window.clearInterval(interval);
      document.body.classList.remove("via1-drone-active");
    };
  }, [onDone]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 z-[60]"
      style={{ top: 0, height: 220 }}
    >
      {/* Anchor genau am Spitz der Pyramide (top ~12px, horizontal zentriert).
          Das innere div rotiert; der Drohnen-SVG sitzt am Orbit-Rand und
          counter-rotiert damit er aufrecht bleibt. */}
      <div
        className="absolute"
        style={{
          top: 18,
          left: "50%",
          width: 0,
          height: 0,
        }}
      >
        <div className="drone-orbit-spin">
          <div className="drone-orbit-bob">
            <DroneSvg />
          </div>
        </div>
      </div>
    </div>
  );
}

function DroneSvg() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="42"
      height="42"
      className="drone-svg block"
    >
      {/* Zentraler Koerper */}
      <rect
        x="26"
        y="26"
        width="12"
        height="12"
        rx="3"
        fill="#1e293b"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      {/* Status-LED */}
      <circle cx="32" cy="32" r="2" fill="#f87171" className="drone-led" />

      {/* Arme (X-Frame) */}
      <line x1="32" y1="32" x2="10" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="54" y2="10" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="10" y2="54" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="54" y2="54" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

      {/* 4 Rotor-Hubs */}
      <circle cx="10" cy="10" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="54" cy="10" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="10" cy="54" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="54" cy="54" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />

      {/* Rotor-Bluetter (drehen sich) */}
      <g className="drone-rotor" style={{ transformOrigin: "10px 10px" }}>
        <ellipse cx="10" cy="10" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "54px 10px" }}>
        <ellipse cx="54" cy="10" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "10px 54px" }}>
        <ellipse cx="10" cy="54" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
      <g className="drone-rotor" style={{ transformOrigin: "54px 54px" }}>
        <ellipse cx="54" cy="54" rx="9" ry="1.5" fill="rgba(148,163,184,0.35)" />
      </g>
    </svg>
  );
}
