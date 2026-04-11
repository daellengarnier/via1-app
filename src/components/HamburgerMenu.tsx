"use client";

import { useState } from "react";
import Link from "next/link";

const wgs = [
  { slug: "nordwind", name: "Nordwind", floor: "EG Nord", residents: 4 },
  { slug: "ostblock", name: "Ostblock", floor: "EG Ost", residents: 5 },
  { slug: "dreiecksbar", name: "Dreiecksbar", floor: "1. OG Nord", residents: 5 },
  { slug: "kleenex", name: "Kleenex", floor: "1. OG Ost", residents: 5 },
  { slug: "family-wg", name: "Family-WG", floor: "2. OG Nord", residents: 5 },
  { slug: "bonzen", name: "Bonzen", floor: "2. OG Ost", residents: 3 },
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-dark/90 backdrop-blur-sm transition-colors hover:border-accent"
        aria-label="Menu oeffnen"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="#b8f068" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] transform border-l border-gray-800 bg-dark transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-5">
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="mb-6 self-end text-gray-500 hover:text-white"
            aria-label="Menu schliessen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Profil Link */}
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="mb-6 flex items-center gap-3 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-accent"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 font-mono text-lg font-bold text-accent">
              A
            </div>
            <div>
              <p className="font-medium text-white">Mein Profil</p>
              <p className="text-xs text-gray-500">alain@via1.ch</p>
            </div>
          </Link>

          {/* WGs & Bewohner:innen */}
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
            Wohngemeinschaften & Bewohner:innen
          </h2>
          <div className="space-y-2">
            {wgs.map((wg) => (
              <Link
                key={wg.slug}
                href={`/wg/${wg.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3 transition-colors hover:border-accent"
              >
                <div>
                  <p className="font-medium text-white">{wg.name}</p>
                  <p className="text-xs text-gray-500">{wg.floor}</p>
                </div>
                <span className="font-mono text-xs text-gray-500">
                  {wg.residents}
                </span>
              </Link>
            ))}
          </div>

          {/* Feedback */}
          <Link
            href="/feedback"
            onClick={() => setOpen(false)}
            className="mt-6 block rounded-lg border border-accent/30 bg-accent/5 py-3 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Idee oder Bug melden
          </Link>

          {/* Abmelden */}
          <button className="mt-3 w-full rounded-lg border border-gray-700 py-2 font-mono text-sm text-gray-400 transition-colors hover:border-red-500 hover:text-red-400">
            Abmelden
          </button>
        </div>
      </div>
    </>
  );
}
