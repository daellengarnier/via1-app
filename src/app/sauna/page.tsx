"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TabHeader } from "@/components/TabHeader";
import { SaunaChart } from "@/components/SaunaChart";

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


const SAUNA_KEY = "via1-sauna-start";
const SAUNA_BY_KEY = "via1-sauna-by";

interface SaunaReading {
  tempTopC: number | null;
  tempBottomC: number | null;
  ageSeconds: number | null;
}

export default function SaunaPage() {
  const { data: session } = useSession();
  const [showReglement, setShowReglement] = useState(false);
  const [reading, setReading] = useState<SaunaReading>({
    tempTopC: null,
    tempBottomC: null,
    ageSeconds: null,
  });
  const [heating, setHeating] = useState<{ startedBy: string | null; minutesAgo: number } | null>(null);

  const fetchReading = useCallback(async () => {
    try {
      const res = await fetch("/api/sauna/current", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as SaunaReading;
      setReading(data);
    } catch {
      // silent
    }
  }, []);

  const refreshHeating = useCallback(() => {
    const stored = localStorage.getItem(SAUNA_KEY);
    if (!stored) {
      setHeating(null);
      return;
    }
    const startTime = parseInt(stored, 10);
    if (Number.isNaN(startTime)) {
      setHeating(null);
      return;
    }
    const start = new Date(startTime);
    const now = new Date();
    if (start.getDate() !== now.getDate() && now.getHours() >= 6) {
      localStorage.removeItem(SAUNA_KEY);
      localStorage.removeItem(SAUNA_BY_KEY);
      setHeating(null);
      return;
    }
    const minutesAgo = Math.round((Date.now() - startTime) / 60000);
    setHeating({
      startedBy: localStorage.getItem(SAUNA_BY_KEY),
      minutesAgo,
    });
  }, []);

  useEffect(() => {
    fetchReading();
    refreshHeating();
    const id = setInterval(() => {
      fetchReading();
      refreshHeating();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchReading, refreshHeating]);

  function startHeating() {
    localStorage.setItem(SAUNA_KEY, String(Date.now()));
    localStorage.setItem(SAUNA_BY_KEY, session?.user?.name ?? "");
    refreshHeating();
    fetch("/api/notifications/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "SAUNA",
        title: "Die Sauna wird eingeheizt 🔥",
        body: `${session?.user?.name ?? "Jemand"} heizt ein — in ~30 Min. bereit`,
        link: "/sauna",
      }),
    }).catch(() => {});
  }

  function stopHeating() {
    localStorage.removeItem(SAUNA_KEY);
    localStorage.removeItem(SAUNA_BY_KEY);
    refreshHeating();
  }

  const isHeating = heating !== null;
  const tempTop = reading.tempTopC;
  const tempBottom = reading.tempBottomC;
  const sensorLive = reading.ageSeconds !== null && reading.ageSeconds < 120;
  const ageMin = reading.ageSeconds !== null ? Math.round(reading.ageSeconds / 60) : null;

  return (
    <div className="relative p-4 pb-20">
      <TabHeader icon="/icon-sauna.webp" color="red" showIcon={false} />

      {/* Heizen Toggle — oberhalb der Temperatur */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-sauna.webp"
          alt=""
          className="tab-btn-icon glow-red"
          loading="eager"
          fetchPriority="high"
        />
        <button
          onClick={() => {
            if (isHeating) stopHeating();
            else startHeating();
          }}
          className={`rounded-full border px-5 py-2 font-display text-[11px] font-bold uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors ${
            isHeating
              ? "border-gray-600/60 bg-gray-700/30 text-white hover:bg-gray-700/50"
              : "border-red-500/50 bg-red-500/20 text-red-200 hover:bg-red-500/30"
          }`}
        >
          {isHeating ? "× Heizung stoppen" : "+ Sauna einheizen"}
        </button>
      </div>

      {/* Live-Sensor-Werte */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {/* Temperatur oben */}
        <div className="flex flex-col items-center rounded-lg border border-gray-800 bg-white/5 p-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-red-400">
            OBEN
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-red-400">
            {tempTop !== null ? `${tempTop.toFixed(1)}°C` : "–"}
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {tempTop === null
              ? "kein Wert"
              : sensorLive
                ? "live"
                : `vor ${ageMin} Min.`}
          </p>
        </div>

        {/* Temperatur unten */}
        <div className="flex flex-col items-center rounded-lg border border-gray-800 bg-white/5 p-4 opacity-60">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-gray-500">
            UNTEN
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-gray-600">
            {tempBottom !== null ? `${tempBottom.toFixed(1)}°C` : "–"}
          </p>
          <p className="mt-1 text-[10px] text-gray-600">
            {tempBottom !== null ? "live" : "nicht verfügbar"}
          </p>
        </div>
      </div>

      {/* Heiz-Status */}
      {isHeating && heating && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
          <p className="text-sm text-red-200">
            🔥 {heating.startedBy ? `${heating.startedBy} heizt ein` : "Eingeheizt"} ·
            vor {heating.minutesAgo} Min.
          </p>
        </div>
      )}

      {/* Verlauf */}
      <SaunaChart hours={2} className="mb-6" />

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
