"use client";

import { useState } from "react";

export default function SaunaPage() {
  const [heating, setHeating] = useState(true);
  const [temperature] = useState(62);

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-6 font-mono text-2xl font-bold text-accent">Sauna</h1>

      {/* Temperatur */}
      <div className="mb-6 flex flex-col items-center rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-8">
        <p className="font-mono text-6xl font-bold text-accent">
          {temperature}°C
        </p>
        <p className="mt-2 text-sm text-gray-400">Aktuelle Temperatur</p>
        {heating && (
          <p className="mt-1 text-sm text-secondary">🔥 Wird geheizt</p>
        )}
      </div>

      {/* Heizen Toggle */}
      <button
        onClick={() => setHeating(!heating)}
        className={`w-full rounded-lg py-3 font-mono font-bold transition-colors ${
          heating
            ? "bg-secondary text-white hover:bg-secondary/80"
            : "bg-accent text-dark hover:brightness-110"
        }`}
      >
        {heating ? "Heizung stoppen" : "Sauna einheizen"}
      </button>

      {heating && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Gestartet von Alain · vor 45 Min.
        </p>
      )}

      {/* Temperaturverlauf Platzhalter */}
      <div className="mt-8">
        <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-accent">
          Temperaturverlauf
        </h2>
        <div className="flex h-32 items-end gap-1 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-4">
          {[20, 28, 35, 42, 48, 53, 57, 60, 62].map((temp, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-accent/60"
              style={{ height: `${(temp / 80) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-600">
          <span>Start</span>
          <span>Jetzt</span>
        </div>
      </div>
    </div>
  );
}
