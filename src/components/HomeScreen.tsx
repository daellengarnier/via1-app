"use client";

import { useRouter } from "next/navigation";

interface Termin {
  id: string;
  title: string;
  date: string;
  location: string;
  type: "sitzung" | "essen" | "sonstige";
}

interface SpinnereiEvent {
  title: string;
  date: string;
  url: string;
}

const nextTermin: Termin = {
  id: "1",
  title: "Haussitzung April",
  date: "2026-04-16T19:30",
  location: "Gemeinschaftsraum EG",
  type: "sitzung",
};

const nextSpinnereiEvent: SpinnereiEvent = {
  title: "Soirée Tropicale",
  date: "2026-04-25T21:00",
  url: "https://kulturspinnerei.ch",
};

const typeLabels = {
  sitzung: "Sitzung",
  essen: "Essen",
  sonstige: "Sonstige",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 17) return "Guten Nachmittag";
  return "Guten Abend";
}

export default function HomeScreen() {
  const router = useRouter();
  // TODO: aus Session lesen
  const userName = "Alain";

  return (
    <div className="p-4 pb-20">
      {/* VIA1 Header */}
      <header className="mb-6 pt-2">
        <h1 className="font-display text-5xl font-bold tracking-tight text-accent">
          VIA1
        </h1>
        <p className="mt-1 text-lg text-gray-300">
          {getGreeting()}, {userName}
        </p>
        <p className="text-sm text-gray-500">Spinnereiweg 17, Bern</p>
      </header>

      {/* Nächster Termin */}
      <div
        className="mb-3 cursor-pointer rounded-lg border border-accent/30 bg-accent/5 p-4 transition-colors hover:bg-accent/10"
        onClick={() => router.push(`/termine/${nextTermin.id}`)}
      >
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          Nächster Termin
        </p>
        <h2 className="mt-1 font-display text-lg font-medium text-white">
          {nextTermin.title}
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(nextTermin.date)} · {formatTime(nextTermin.date)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-xs text-accent">
            {typeLabels[nextTermin.type]}
          </span>
          <span className="text-xs text-gray-500">{nextTermin.location}</span>
        </div>
      </div>

      {/* Nächster Spinnerei-Anlass */}
      <a
        href={nextSpinnereiEvent.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 block rounded-lg border border-purple-500/30 bg-purple-500/5 p-4 transition-colors hover:bg-purple-500/10"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-purple-400">
          Kulturspinnerei
        </p>
        <h2 className="mt-1 font-display text-lg font-medium text-white">
          {nextSpinnereiEvent.title}
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(nextSpinnereiEvent.date)} ·{" "}
          {formatTime(nextSpinnereiEvent.date)}
        </p>
        <p className="mt-1 text-xs text-purple-400/60">
          kulturspinnerei.ch →
        </p>
      </a>

      {/* Quick Widgets */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sauna */}
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/sauna")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Sauna
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-accent">
            62°C
          </p>
          <p className="mt-1 text-xs text-gray-500">Wird geheizt</p>
        </div>

        {/* Aufgaben */}
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/aufgaben")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Aufgaben
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-secondary">
            3
          </p>
          <p className="mt-1 text-xs text-gray-500">offen</p>
        </div>

        {/* Putzdienst */}
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/putzplan")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Putzdienst
          </p>
          <p className="mt-1 font-display text-lg font-bold text-accent">
            Dreiecksbar
          </p>
          <p className="mt-1 text-xs text-gray-500">ist dran</p>
        </div>

        {/* Gästi */}
        <div
          className="cursor-pointer rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4 transition-colors hover:border-gray-700"
          onClick={() => router.push("/gaesti")}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Gästi
          </p>
          <p className="mt-1 font-display text-lg font-bold text-accent">
            Frei
          </p>
          <p className="mt-1 text-xs text-gray-500">Nächste: 21. Apr</p>
        </div>
      </div>
    </div>
  );
}
