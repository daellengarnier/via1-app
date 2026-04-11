"use client";

import { useState } from "react";

type AboType = "1-espresso" | "1-doppio" | "2-doppio" | "kein";

const aboLabels: Record<AboType, string> = {
  "1-espresso": "1 Espresso / Tag",
  "1-doppio": "1 Doppio / Tag",
  "2-doppio": "2 Doppio / Tag",
  kein: "Kein Abo",
};

interface KaffeeInfo {
  currentBeans: string;
  roaster: string;
  changedBy: string;
  changedAt: string;
}

const initialKaffee: KaffeeInfo = {
  currentBeans: "Ethiopia Yirgacheffe",
  roaster: "Bertschi Kaffee, Bern",
  changedBy: "Sophie",
  changedAt: "2026-04-09",
};

export default function KaffeePage() {
  const [abo, setAbo] = useState<AboType>("1-doppio");
  const [kaffee, setKaffee] = useState(initialKaffee);
  const [showChangeBeans, setShowChangeBeans] = useState(false);
  const [newBeans, setNewBeans] = useState("");
  const [saved, setSaved] = useState(false);
  const [showTab, setShowTab] = useState(true);

  function handleSaveAbo() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChangeBeans(e: React.FormEvent) {
    e.preventDefault();
    if (!newBeans.trim()) return;
    setKaffee({
      ...kaffee,
      currentBeans: newBeans,
      changedBy: "Alain",
      changedAt: new Date().toISOString().split("T")[0]!,
    });
    setNewBeans("");
    setShowChangeBeans(false);
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="mb-1 text-2xl font-bold text-white">Kaffee</h1>
      <p className="mb-6 text-sm text-gray-500">Hauseigene Kaffeemaschine</p>

      {/* Aktuelle Bohnen */}
      <div className="mb-6 rounded-lg border border-amber-600/30 bg-amber-600/5 p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
          AKTUELL IN DER MÜHLE
        </p>
        <p className="mt-1 text-xl font-bold text-amber-200">
          {kaffee.currentBeans}
        </p>
        <p className="mt-1 text-sm text-gray-400">{kaffee.roaster}</p>
        <p className="mt-1 text-xs text-gray-600">
          Eingefüllt von {kaffee.changedBy} ·{" "}
          {new Date(kaffee.changedAt).toLocaleDateString("de-CH", {
            day: "numeric",
            month: "long",
          })}
        </p>

        <button
          onClick={() => setShowChangeBeans(!showChangeBeans)}
          className="mt-3 w-full rounded bg-amber-600/20 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-600/30"
        >
          Bohnen aktualisieren
        </button>

        {showChangeBeans && (
          <form onSubmit={handleChangeBeans} className="mt-2 flex gap-2">
            <input
              type="text"
              value={newBeans}
              onChange={(e) => setNewBeans(e.target.value)}
              placeholder="z.B. Colombia Supremo"
              className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="rounded bg-amber-600 px-3 py-2 text-xs font-bold text-white"
            >
              OK
            </button>
          </form>
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
                  : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
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

      {/* Tab ausblenden */}
      <section className="mb-6">
        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3">
          <div>
            <span className="text-sm text-white">Kaffee-Tab anzeigen</span>
            <p className="text-xs text-gray-600">
              Ausblenden wenn du kein Kaffee-Abo hast
            </p>
          </div>
          <button
            onClick={() => setShowTab(!showTab)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              showTab ? "bg-accent" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                showTab ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </section>

      {/* Info */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-accent">
          INFO
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Das Kaffee-Abo deckt die Kosten für Bohnen und Unterhalt der
          Kaffeemaschine. Die Abrechnung erfolgt halbjährlich. Anmeldung
          und Fragen bei Alain oder Sophie.
        </p>
      </div>
    </div>
  );
}
