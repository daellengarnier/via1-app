"use client";

import Link from "next/link";

interface Props {
  /** Wenn gesetzt: rendert "← <wgName>"-Back-Link */
  backToWgSlug?: string;
  backToWgName?: string;
  /** Haupt-Titel: WG-Name oder Feature-Name */
  title: string;
  /** Optional: kleine Sub-Zeile (z.B. "EG · Nord · Privater Bereich") */
  subtitle?: string;
}

// Einheitlicher Header fuer alle "Meine WG"-Seiten:
// - genug pt damit Notification-/Tetris-Buttons den Titel nicht ueberlappen
// - kreative Caveat-Schrift mit Pink-Fuchsia-Cyan Gradient
// - leichter Background-Glow im Hintergrund
export function WgPageHeader({
  backToWgSlug,
  backToWgName,
  title,
  subtitle,
}: Props) {
  return (
    <div className="relative pt-14">
      {/* Hintergrund-Glow nur fuer den Header-Bereich */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 wg-bg-glow" />

      {backToWgSlug && backToWgName && (
        <Link
          href={`/meine-wg/${backToWgSlug}`}
          className="font-mono text-[10px] uppercase tracking-widest text-gray-300 hover:text-white"
        >
          ← {backToWgName}
        </Link>
      )}

      <h1
        className="font-display text-4xl font-bold uppercase leading-none tracking-wider text-white sm:text-5xl"
        style={{
          textShadow:
            "0 1px 0 rgba(255,255,255,0.15), 0 2px 12px rgba(0,0,0,0.7)",
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
