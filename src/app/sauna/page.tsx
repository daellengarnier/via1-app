"use client";

import { useState } from "react";
import { TabHeader } from "@/components/TabHeader";

const saunaSections = [
  {
    title: "Vor dem Saunieren",
    items: [
      "Duschen: entfernt Deo-/Cremerückstände, ermöglicht besseres Schwitzen, weniger unangenehme Gerüche für Mitsaunierende",
      "Mitnehmen: Tüechli (genug gross für ganzen Körper + Füsse), evtl. Bademantel, evtl. 2. Tüechli zum Abtrocknen nach Duschen, Badeschlappen, Trinkflasche",
      "Kleider und Schuhe vor der Sauna deponieren (keine Kleider mit in Sauna nehmen)",
    ],
  },
  {
    title: "Während dem Saunieren",
    items: [
      "Absolutes Rauch- und Kerzenverbot in der Sauna!",
      "Füsse putzen vor Betreten der Sauna (selber Wasser mitnehmen, Tüechli, Bäseli o.Ä.)",
      "Kein Schweiss auf Holzbank, ganzer Körper inkl. Füsse auf Tüechli",
    ],
  },
  {
    title: "Fürs Abkühlen dazwischen",
    items: [
      "Dusche links neben Sauna (bei sehr niedrigen Temperaturen evtl. zugefroren)",
    ],
  },
  {
    title: "Nach dem Saunieren",
    items: [
      "Abfall und Leergut mitnehmen und direkt entsorgen (kein Leergut-Lager bei Sauna)",
      "Licht löschen, Lüftungsschieber an hinteren rechten Wand öffnen (oben und unten), Türe schliessen",
    ],
  },
  {
    title: "Vorplatz",
    items: [
      "Mit Tüechli oder Bademantel auf Stühle",
      "Vorsicht mit Glasflaschen",
      "Zigiasche und -stummel in Aschenbecher (Konfiglas)",
      "Abfall/Leergut direkt entsorgen",
    ],
  },
  {
    title: "Bezahlung",
    items: [
      "Via 1 Bewohnende machen 1 Strichli pro Saunabesuch (Abrechnung halbjährlich)",
      "Genossenschaftler*innen (2, 3, 4) und Besucher*innen: Twint (QR Code) 5.– pro Person",
    ],
  },
  {
    title: "Inbetriebnahme der Sauna",
    items: [
      "Ascheschublade leeren (in den dafür vorgesehenen Kasten → Sarah kümmert sich)",
      "Lüftungsschieber an rechter Wand (oben und unten) schliessen",
      "Wasser in Kupferkessel auffüllen, Kelle nicht drin lassen",
      "Feuer: vorzugsweise mit Briketts und etwas Karton entzünden, Aschenschublade leicht öffnen bis das Feuer gut brennt, danach schliessen",
      "Briketts ganz nach hinten schieben (diese quellen beim Verbrennen auf und können so die Ofentür aufstossen)",
      "Info in Sauna-Gruppenchat, dass Sauna eingeheizt wird",
      "Tipp: 3 Briketts nebeneinander decken den Rost gut ab → effizientes Einheizen",
      "Nach ca. 30 Minuten Briketts nachlegen oder mit dem Saunieren beginnen",
      "Briketts sind im Holzlager neben der Sauna (in Kartonschachteln), Nachschub gibt's in der Pyramide unter der Treppe",
    ],
  },
  {
    title: "Aufguss",
    items: [
      "Ätherische Öle in kleinen Glasfläschchen: 2–3 Tropfen in Kelle mit Wasser und über die heissen Steine giessen",
      "Saunaaufguss-Duft in grosser Flasche: ein Spritzer in den Kupferkessel, mit der Kelle rühren und über die heissen Steine giessen",
    ],
  },
  {
    title: "Wartung / Reinigung",
    items: [
      "Alle die die Sauna nutzen helfen regelmässig mit, diese sauber zu halten",
      "Vorplatz mit Laubbläser oder Besen putzen",
      "Saunakabine staubsaugen",
      "Saunabänke mit lauwarmem Wasser abwischen",
      "Saunaofen-Wartung: Cyril",
      "Holzbestellung: Cyril",
      "Schäden beheben/Materialwartung: Cyrill oder Yves (bei Saunabänken)",
    ],
  },
  {
    title: "Kommunikation",
    items: [
      "Schäden/Mängel bitte direkt in Sauna-Gruppenchat melden",
      "Wenn Verbrauchsmaterial aufgebraucht, bitte entsorgen und direkt in Sauna-Gruppenchat melden (z.B. ätherisches Öl)",
    ],
  },
  {
    title: "Tipps und Tricks",
    items: [
      "Körper ganz abtrocknen vor dem Saunieren",
      "Genügend Wasser trinken vor und während dem Saunieren",
      "Baumwolltüechli verwenden, kein synthetisches Material",
      "Am besten nackt saunieren oder mit frischer Baumwollkleidung",
      "Mitsaunierende fragen, wenn Musik abgespielt wird",
      "12–15 min pro Saunagang reichen aus",
      "15–30 min Pause zwischen den Saunagängen empfohlen",
      "Kaltes Wasser zum Abkühlen von den Extremitäten her bis zum Herz",
    ],
  },
];

// Mock Temperaturverlauf
const tempHistory = [20, 25, 32, 38, 44, 49, 53, 56, 59, 61, 62, 62];

export default function SaunaPage() {
  const [heating, setHeating] = useState(true);
  const [temperature] = useState(62);
  const [showReglement, setShowReglement] = useState(false);

  // SVG Linie für Temperaturverlauf
  const svgWidth = 300;
  const svgHeight = 40;
  const points = tempHistory
    .map((t, i) => {
      const x = (i / (tempHistory.length - 1)) * svgWidth;
      const y = svgHeight - (t / 80) * svgHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative p-4 pb-20">
      <TabHeader icon="/icon-sauna.webp" color="red" />

      {/* Heizen Toggle — oberhalb der Temperatur */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setHeating(!heating)}
          className={`rounded-full px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider transition-colors ${
            heating
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500 text-white hover:brightness-110"
          }`}
        >
          {heating ? "× Heizung stoppen" : "+ Sauna einheizen"}
        </button>
      </div>

      {/* Temperatur */}
      <div className="mb-6 flex flex-col items-center rounded-lg border border-gray-800 bg-white/5 p-5">
        <p className="font-mono text-4xl font-bold text-red-400">
          {temperature}°C
        </p>
        <p className="mt-1 text-xs text-gray-400">Aktuelle Temperatur</p>
        {heating && (
          <p className="mt-1 text-sm text-secondary">🔥 Wird geheizt · Gestartet von Alain vor 45 Min.</p>
        )}

        {/* Temperaturverlauf als dezente Linie */}
        <div className="mt-4 w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="h-8 w-full"
            preserveAspectRatio="none"
          >
            <polyline
              points={points}
              fill="none"
              stroke="#b8f068"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Start</span>
            <span>Jetzt</span>
          </div>
        </div>
      </div>

      {/* Sauna-Reglement */}
      <div className="mt-8">
        <button
          onClick={() => setShowReglement(!showReglement)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-white/5 p-3"
        >
          <span className="font-display text-[10px] font-bold uppercase tracking-widest text-red-400">
            SAUNA-REGLEMENT
          </span>
          <span className="text-gray-500">{showReglement ? "▲" : "▼"}</span>
        </button>

        {showReglement && (
          <div className="mt-2 space-y-4 rounded-lg border border-gray-800 bg-white/5 p-4">
            <p className="text-center font-mono text-[10px] text-gray-600">
              Sauna Via 1 · 03/2026
            </p>
            {saunaSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-1.5 text-sm font-semibold text-white">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs leading-relaxed text-gray-400"
                    >
                      <span className="mt-0.5 shrink-0 text-red-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
