"use client";

import { ReactNode } from "react";
import Link from "next/link";

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-accent">
      {children}
    </h2>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-4 p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-center font-cinzel text-3xl text-accent">via1</h1>
        <p className="text-sm text-gray-400">Spinnereiweg 17, Bern</p>
      </header>

      {/* Nächste Sitzung */}
      <Card>
        <SectionTitle>Nächste Sitzung</SectionTitle>
        <Link href="/termine" className="block">
          <p className="text-lg font-medium text-white">Haussitzung</p>
          <p className="text-sm text-gray-400">
            Mittwoch, 16. April 2026 · 19:30
          </p>
          <p className="mt-1 text-sm text-gray-500">
            3 Traktanden · Gemeinschaftsraum EG
          </p>
        </Link>
      </Card>

      {/* Putzdienst */}
      <Card>
        <SectionTitle>Putzdienst</SectionTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">Diesen Monat dran:</p>
            <p className="font-mono text-lg font-bold text-accent">
              Dreiecksbar
            </p>
          </div>
          <Link
            href="/putzplan"
            className="text-sm text-gray-400 hover:text-accent"
          >
            Plan →
          </Link>
        </div>
      </Card>

      {/* Aufgaben */}
      <Card>
        <SectionTitle>Offene Aufgaben</SectionTitle>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-secondary">●</span>
            <div>
              <p className="text-sm text-white">Laub auf Wegen entfernen</p>
              <p className="text-xs text-gray-500">Aussenbereich</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-secondary">●</span>
            <div>
              <p className="text-sm text-white">Waschküche reinigen</p>
              <p className="text-xs text-gray-500">UG</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">●</span>
            <div>
              <p className="text-sm text-white">Aprikosenbaum schneiden</p>
              <p className="text-xs text-gray-500">Garten Süd</p>
            </div>
          </li>
        </ul>
        <Link
          href="/aufgaben"
          className="mt-3 block text-right text-sm text-gray-400 hover:text-accent"
        >
          Alle anzeigen →
        </Link>
      </Card>

      {/* Sauna + Wohnwagen */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Sauna</SectionTitle>
          <p className="font-mono text-3xl font-bold text-accent">62°C</p>
          <p className="mt-1 text-xs text-gray-400">Wird geheizt 🔥</p>
        </Card>
        <Card>
          <SectionTitle>Wohnwagen</SectionTitle>
          <p className="font-mono text-lg font-bold text-accent">Frei</p>
          <p className="mt-1 text-xs text-gray-400">
            Nächste Buchung: 21. Apr
          </p>
        </Card>
      </div>
    </div>
  );
}
