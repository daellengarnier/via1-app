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
          className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-300/80 hover:text-fuchsia-200"
        >
          ← {backToWgName}
        </Link>
      )}

      <h1 className="wg-title-gradient font-caveat text-5xl font-bold leading-none tracking-tight sm:text-6xl">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-fuchsia-300/70">
          {subtitle}
        </p>
      )}
    </div>
  );
}
