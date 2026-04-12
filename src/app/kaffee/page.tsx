"use client";

import { useState } from "react";

type AboType = "1-espresso" | "1-doppio" | "2-doppio" | "kein";

const aboLabels: Record<AboType, string> = {
  "1-espresso": "1 Espresso / Tag",
  "1-doppio": "1 Doppio / Tag",
  "2-doppio": "2 Doppio / Tag",
  kein: "Kein Abo",
};

interface RastKaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

// Sortiment Rast Kaffee (Ebikon) — manuell gepflegt nach rastshop.ch
const rastSortiment: RastKaffee[] = [
  {
    name: "Milano",
    herkunft: "Guatemala, Costa Rica, Brasilien, Java",
    duftnotizen: "Kräftig, schokoladig, voller Körper",
    fairtrade: false,
  },
  {
    name: "Bologna Bio Fairtrade",
    herkunft: "Bio Arabica Blend",
    duftnotizen: "Klassisch italienisch, modern & frisch",
    fairtrade: true,
  },
  {
    name: "Como Bio Fairtrade",
    herkunft: "Bio Arabica",
    duftnotizen: "Bittermandel, Schokolade, feine Zitrusnote",
    fairtrade: true,
  },
  {
    name: "Bio Espresso",
    herkunft: "Brasilien, Indonesien (Bio)",
    duftnotizen: "Beeren, dunkle Nussschokolade",
    fairtrade: true,
  },
  {
    name: "Yirga Cheffe Bio",
    herkunft: "Äthiopien (1500-2200m)",
    duftnotizen: "Jasmin, Bergamotte, Blumen",
    fairtrade: true,
  },
  {
    name: "Barista Espresso",
    herkunft: "Kenia, Guatemala, Indonesien, Indien, Brasilien",
    duftnotizen: "Komplex, intensiv, lange Crema",
    fairtrade: false,
  },
  {
    name: "Eldorado",
    herkunft: "Indien, Guatemala, Brasilien, Costa Rica",
    duftnotizen: "Ausgewogen, süsslich, Karamell",
    fairtrade: false,
  },
  {
    name: "Premium",
    herkunft: "Indonesien, Guatemala, Brasilien, Indien",
    duftnotizen: "Vollmundig, nussig, wenig Säure",
    fairtrade: false,
  },
  {
    name: "Wiener",
    herkunft: "Guatemala, Costa Rica, Brasilien, Indonesien",
    duftnotizen: "Traditionell, weich, nussig",
    fairtrade: false,
  },
  {
    name: "Festival",
    herkunft: "Kenia, Guatemala, Brasilien, Costa Rica",
    duftnotizen: "Fruchtig, lebendig, feine Säure",
    fairtrade: false,
  },
  {
    name: "Jubiläums-Edition",
    herkunft: "Papua-Neuguinea, Costa Rica, Guatemala, Kolumbien, Brasilien",
    duftnotizen: "Komplex, festlich, ausgewogen",
    fairtrade: false,
  },
  {
    name: "Home-Office",
    herkunft: "Blend",
    duftnotizen: "Mild, ausgewogen, für jede Tageszeit",
    fairtrade: false,
  },
  {
    name: "Koffeinfrei Bio Fairtrade",
    herkunft: "Bio Arabica",
    duftnotizen: "Mild, rund, Schokolade",
    fairtrade: true,
  },
];

export default function KaffeePage() {
  const [abo, setAbo] = useState<AboType>("1-doppio");
  const [currentBeans, setCurrentBeans] = useState("Bologna Bio Fairtrade");
  const [changedBy] = useState("Sophie");
  const [changedAt] = useState("2026-04-09");
  const [showSelect, setShowSelect] = useState(false);
  const [saved, setSaved] = useState(false);


  const currentInfo = rastSortiment.find((k) => k.name === currentBeans);

  function handleSaveAbo() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-1 text-center font-cinzel text-3xl text-accent">Kaffee</h1>
      <p className="mb-6 text-sm text-gray-500">Hauseigene Kaffeemaschine</p>

      {/* Aktuelle Bohnen */}
      <div className="mb-6 rounded-lg border border-amber-600/30 bg-gradient-to-b from-amber-600/10 to-transparent p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
          AKTUELL IN DER MÜHLE
        </p>
        <p className="mt-1 text-xl font-semibold text-amber-200">
          {currentBeans}
        </p>
        {currentInfo && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-400">
              <span className="text-gray-600">Herkunft:</span>{" "}
              {currentInfo.herkunft}
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-600">Duftnotizen:</span>{" "}
              {currentInfo.duftnotizen}
            </p>
            {currentInfo.fairtrade && (
              <p className="text-xs text-emerald-500">Fair Trade</p>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-gray-600">
          Eingefüllt von {changedBy} ·{" "}
          {new Date(changedAt).toLocaleDateString("de-CH", {
            day: "numeric",
            month: "long",
          })}
        </p>

        <button
          onClick={() => setShowSelect(!showSelect)}
          className="mt-3 w-full rounded bg-amber-600/20 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-600/30"
        >
          Bohnen wechseln
        </button>

        {showSelect && (
          <div className="mt-2 space-y-1">
            {rastSortiment.map((k) => (
              <button
                key={k.name}
                onClick={() => {
                  setCurrentBeans(k.name);
                  setShowSelect(false);
                }}
                className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                  currentBeans === k.name
                    ? "border-amber-600/50 bg-amber-600/10"
                    : "border-gray-800 bg-black/30 hover:border-gray-700"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{k.name}</p>
                  <p className="text-xs text-gray-500">{k.duftnotizen}</p>
                  <p className="text-xs text-gray-600">
                    {k.herkunft}
                    {k.fairtrade && (
                      <span className="ml-1 text-emerald-600">· Fair Trade</span>
                    )}
                  </p>
                </div>
                {currentBeans === k.name && (
                  <span className="text-xs text-amber-500">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mein Abo */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          MEIN ABO
        </h2>
        <div className="space-y-2">
          {(Object.keys(aboLabels) as AboType[]).map((type) => (
            <button
              key={type}
              onClick={() => setAbo(type)}
              className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                abo === type
                  ? type === "kein"
                    ? "border-gray-600 bg-gray-800/50"
                    : "border-amber-600/50 bg-amber-600/10"
                  : "border-gray-800 bg-black/20 hover:border-gray-700"
              }`}
            >
              <span
                className={`text-sm ${
                  abo === type
                    ? type === "kein"
                      ? "text-gray-400"
                      : "font-semibold text-amber-200"
                    : "text-gray-400"
                }`}
              >
                {aboLabels[type]}
              </span>
              {abo === type && (
                <span className="text-xs text-amber-500">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleSaveAbo}
          className={`mt-3 w-full rounded-lg py-2 text-sm font-bold transition-colors ${
            saved
              ? "bg-accent/20 text-accent"
              : "bg-accent text-dark hover:brightness-110"
          }`}
        >
          {saved ? "Gespeichert!" : "Abo speichern"}
        </button>
      </section>

      {/* Bezahlung */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          BEZAHLUNG
        </h2>
        <div className="rounded-lg border border-gray-800 bg-black/20 p-4">
          <p className="mb-2 text-sm text-gray-300">
            Bitte einen <strong className="text-white">Dauerauftrag</strong> einrichten:
          </p>
          <div className="rounded bg-black/30 p-3 font-mono text-xs leading-relaxed text-gray-300">
            <p className="text-amber-200">CH19 0079 0016 9408 2010 4</p>
            <p className="mt-1">Verein Viva Via</p>
            <p>Spinnereiweg 17</p>
            <p>3004 Bern</p>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Bitte <strong className="text-amber-200">&quot;Kafiabo &amp; Name&quot;</strong> vermerken,
            damit wir die Zahlung zuordnen können.
          </p>
        </div>
      </section>

      {/* Info */}
      <div className="rounded-lg border border-gray-800 bg-black/20 p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          INFO
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Das Kaffee-Abo deckt die Kosten für Bohnen und Unterhalt der
          Kaffeemaschine. Wir beziehen den Kaffee von Rast Kaffee (Bern).
          Anmeldung und Fragen bei Alain oder Sophie.
        </p>
      </div>
    </div>
  );
}
