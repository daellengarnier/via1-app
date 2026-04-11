"use client";

import { useState } from "react";
import Link from "next/link";

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-dark/90 backdrop-blur-sm transition-colors hover:border-accent"
        aria-label="Menu öffnen"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 font-display text-lg font-bold text-accent">
              A
            </div>
            <div>
              <p className="font-medium text-white">Mein Profil</p>
            </div>
          </Link>

          {/* Bewohnende */}
          <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            BEWOHNENDE
          </h2>
          <Link
            href="/bewohnende"
            onClick={() => setOpen(false)}
            className="mb-6 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3 transition-colors hover:border-accent"
          >
            <div>
              <p className="font-medium text-accent">Alle Bewohnenden</p>
              <p className="text-xs text-gray-500">WGs, Zimmer, Schlüssel, Historie</p>
            </div>
            <span className="text-gray-500">›</span>
          </Link>

          {/* Mehr */}
          <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
            MEHR
          </h2>
          <div className="mb-6 space-y-2">
            <Link
              href="/hausbuch"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3 transition-colors hover:border-accent"
            >
              <span className="text-lg">📖</span>
              <div>
                <p className="font-medium text-white">Hausbuch</p>
                <p className="text-xs text-gray-500">Wissen & Infos rund ums Haus</p>
              </div>
            </Link>
            <Link
              href="/flohmi"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3 transition-colors hover:border-accent"
            >
              <span className="text-lg">🛍️</span>
              <div>
                <p className="font-medium text-white">Flohmi</p>
                <p className="text-xs text-gray-500">Dinge zum Weitergeben</p>
              </div>
            </Link>
          </div>

          {/* Feedback */}
          <Link
            href="/feedback"
            onClick={() => setOpen(false)}
            className="block rounded-lg border border-accent/30 bg-accent/5 py-3 text-center font-display text-[10px] font-bold uppercase tracking-widest text-accent transition-colors hover:bg-accent/10"
          >
            IDEE ODER BUG MELDEN
          </Link>

          {/* Abmelden */}
          <button className="mt-3 w-full rounded-lg border border-gray-700 py-2 font-display text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:border-red-500 hover:text-red-400">
            ABMELDEN
          </button>
        </div>
      </div>
    </>
  );
}
