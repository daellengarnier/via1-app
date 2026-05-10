"use client";

import { useRouter } from "next/navigation";

export default function ModellPage() {
  const router = useRouter();

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => router.back()}
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
      >
        ← Zurück
      </button>

      <h1 className="mb-1 text-center font-display font-bold uppercase tracking-wider text-3xl text-accent">
        3D Modell Via1
      </h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Das Haus interaktiv erkunden
      </p>

      <div className="relative flex h-[60vh] items-center justify-center overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/5 to-transparent">
        {/* Pyramide als Platzhalter */}
        <div className="relative">
          <div
            className="h-48 w-48 bg-gradient-to-b from-accent/40 to-accent/5"
            style={{
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <span className="text-xs text-accent/70">🏠</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Bald verfügbar
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Das interaktive 3D-Modell der Spinnerei wird hier angezeigt.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-800 bg-white/5 p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          WAS KOMMT
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-400">
          <li>· Avatare in Wohnungen sichtbar</li>
          <li>· Tickets & Aufgaben als ortsbezogene Marker</li>
          <li>· Sauna-Temperatur live am Modell</li>
          <li>· 6 WGs in Nord- und Ost-Flügel erkundbar</li>
        </ul>
      </div>
    </div>
  );
}
