"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCurrentKaffee } from "@/lib/kaffee-store";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { compressImage } from "@/lib/image-compress";

type AboType = "1-espresso" | "1-doppio" | "2-doppio" | "kein";

const aboOptions: {
  type: AboType;
  label: string;
  price: string;
  detail: string;
}[] = [
  {
    type: "1-espresso",
    label: "1 Espresso / Tag",
    price: "CHF 9.–",
    detail: "30 Rp. / Espresso",
  },
  {
    type: "1-doppio",
    label: "1 Doppio / Tag",
    price: "CHF 18.–",
    detail: "30 Rp. / Espresso (2 pro Doppio)",
  },
  {
    type: "2-doppio",
    label: "2 Doppio / Tag",
    price: "CHF 36.–",
    detail: "30 Rp. / Espresso (4 pro Tag)",
  },
  {
    type: "kein",
    label: "Kein Abo (Einzelkauf)",
    price: "—",
    detail: "50 Rp. / Espresso",
  },
];

interface RastKaffee {
  name: string;
  herkunft: string;
  duftnotizen: string;
  fairtrade: boolean;
}

// Sucht den Kaffee auf rastshop.ch via WordPress-Suche.
function rastShopUrl(name: string): string {
  return `https://www.rastshop.ch/?s=${encodeURIComponent(name)}`;
}

// Sortiment Rast Kaffee (Ebikon) — nach rastshop.ch.
// Falls eine Sorte fehlt, kann sie via Foto-Scan oder manuell erfasst werden.
const rastSortiment: RastKaffee[] = [
  // Italienische Espresso-Blends
  {
    name: "Milano",
    herkunft: "Guatemala, Costa Rica, Brasilien, Java",
    duftnotizen: "Kräftig, schokoladig, voller Körper",
    fairtrade: false,
  },
  {
    name: "Napoli",
    herkunft: "Indonesien, Brasilien, Guatemala",
    duftnotizen: "Dunkel geröstet, intensiv, kräftige Crema",
    fairtrade: false,
  },
  {
    name: "Vesuvio",
    herkunft: "Brasilien, Guatemala, Indonesien",
    duftnotizen: "Bittermandel, Schokolade",
    fairtrade: false,
  },
  {
    name: "Torino",
    herkunft: "Brasilien, Guatemala, Costa Rica",
    duftnotizen: "Rund, harmonisch, leichte Schokoladennote",
    fairtrade: false,
  },
  {
    name: "Roma",
    herkunft: "Brasilien, Guatemala, Indien",
    duftnotizen: "Klassisch italienisch, kräftig, schokoladig",
    fairtrade: false,
  },
  {
    name: "Sicilia",
    herkunft: "Brasilien, Indonesien, Indien",
    duftnotizen: "Dunkel, würzig, kräftiger Körper",
    fairtrade: false,
  },
  {
    name: "Firenze",
    herkunft: "Brasilien, Guatemala, Costa Rica",
    duftnotizen: "Mittelkräftig, nussig, fein",
    fairtrade: false,
  },
  {
    name: "Verona",
    herkunft: "Brasilien, Kolumbien, Guatemala",
    duftnotizen: "Ausgewogen, mild, süsslich",
    fairtrade: false,
  },
  {
    name: "Genova",
    herkunft: "Brasilien, Kolumbien, Indien",
    duftnotizen: "Mild, nussig, wenig Säure",
    fairtrade: false,
  },

  // Bio / Fairtrade Blends
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
    name: "Koffeinfrei Bio Fairtrade",
    herkunft: "Bio Arabica",
    duftnotizen: "Mild, rund, Schokolade",
    fairtrade: true,
  },

  // Hausblends / spezielle
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
    name: "Crema Italia",
    herkunft: "Brasilien, Indien, Guatemala",
    duftnotizen: "Cremig, ausgewogen, leichte Schokoladennote",
    fairtrade: false,
  },

  // Länder-Kaffees (Single Origin)
  {
    name: "Yirga Cheffe Bio",
    herkunft: "Äthiopien (1500–2200m)",
    duftnotizen: "Jasmin, Bergamotte, Blumen",
    fairtrade: true,
  },
  {
    name: "Guatemala Huehuetenango",
    herkunft: "Guatemala (Huehuetenango)",
    duftnotizen: "Zart, fruchtig, Kakao, feine Säure",
    fairtrade: false,
  },
  {
    name: "Brasil Santos",
    herkunft: "Brasilien (Santos)",
    duftnotizen: "Nussig, mild, Karamell",
    fairtrade: false,
  },
  {
    name: "Colombia Supremo",
    herkunft: "Kolumbien",
    duftnotizen: "Ausgewogen, fruchtig, würzig",
    fairtrade: false,
  },
  {
    name: "Kenia AA",
    herkunft: "Kenia (Hochland)",
    duftnotizen: "Beerig, weinig, intensive Säure",
    fairtrade: false,
  },
  {
    name: "Costa Rica Tarrazu",
    herkunft: "Costa Rica (Tarrazu)",
    duftnotizen: "Hell, zitrusfrisch, klare Süsse",
    fairtrade: false,
  },
  {
    name: "Indonesia Mandheling",
    herkunft: "Indonesien (Sumatra)",
    duftnotizen: "Erdig, dunkel, wenig Säure",
    fairtrade: false,
  },
  {
    name: "India Monsooned Malabar",
    herkunft: "Indien (Malabar)",
    duftnotizen: "Würzig, erdig, wenig Säure, voller Körper",
    fairtrade: false,
  },
  {
    name: "APG Coatepec Veracruz",
    herkunft: "Mexiko (Coatepec, Veracruz)",
    duftnotizen: "Nussig, Karamell, milde Säure",
    fairtrade: false,
  },
];

export default function KaffeePage() {
  const { data: session } = useSession();
  const [abo, setAbo] = useState<AboType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("via1-kaffee-abo-type");
      if (
        stored === "1-espresso" ||
        stored === "1-doppio" ||
        stored === "2-doppio" ||
        stored === "kein"
      ) {
        return stored;
      }
    }
    return "1-doppio";
  });
  const [state, setCurrentKaffee] = useCurrentKaffee();
  const currentKaffee = state.kaffee;
  const changedBy = state.changedBy;
  const changedAt = state.changedAt;
  const [showSelect, setShowSelect] = useState(false);
  const [saved, setSaved] = useState(false);

  // Eigenen Kaffee erfassen
  const [showCustom, setShowCustom] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customHerkunft, setCustomHerkunft] = useState("");
  const [customDuftnotizen, setCustomDuftnotizen] = useState("");
  const [customFairtrade, setCustomFairtrade] = useState(false);

  const currentBeans = currentKaffee.name;
  const currentInfo = rastSortiment.find((k) => k.name === currentBeans) ?? currentKaffee;
  const isRastKaffee = rastSortiment.some((k) => k.name === currentBeans);

  function applyKaffee(k: RastKaffee) {
    setCurrentKaffee(k, session?.user?.name ?? "");
    setShowSelect(false);
    setShowCustom(false);
    if (currentBeans !== k.name) {
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "KAFFEE_CHANGED",
          title: `Neue Kaffeebohnen: ${k.name}`,
          body: k.duftnotizen,
          link: "/kaffee",
        }),
      }).catch(() => {});
    }
  }

  function saveCustomKaffee(e: React.FormEvent) {
    e.preventDefault();
    const name = customName.trim();
    if (!name) return;
    applyKaffee({
      name,
      herkunft: customHerkunft.trim(),
      duftnotizen: customDuftnotizen.trim(),
      fairtrade: customFairtrade,
    });
    // Form zuruecksetzen
    setCustomName("");
    setCustomHerkunft("");
    setCustomDuftnotizen("");
    setCustomFairtrade(false);
  }

  async function handleScanPhoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanError(null);
    setScanning(true);
    try {
      // Komprimieren auf max 1200px damit API-Call schnell ist
      const dataUrl = await compressImage(file, {
        maxSize: 1200,
        quality: 0.82,
      });
      const res = await fetch("/api/kaffee/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setScanError(err.error ?? "Scan fehlgeschlagen");
        return;
      }
      const data = (await res.json()) as {
        name: string;
        herkunft: string;
        duftnotizen: string;
        fairtrade: boolean;
      };
      if (data.name) setCustomName(data.name);
      if (data.herkunft) setCustomHerkunft(data.herkunft);
      if (data.duftnotizen) setCustomDuftnotizen(data.duftnotizen);
      setCustomFairtrade(data.fairtrade);
      if (!showCustom) setShowCustom(true);
    } catch (err) {
      console.error("Scan", err);
      setScanError("Bild konnte nicht verarbeitet werden.");
    } finally {
      setScanning(false);
    }
  }

  function handleSaveAbo() {
    localStorage.setItem("via1-kaffee-abo-type", abo);
    // hasKaffeeAbo im Profil setzen (true wenn nicht "kein")
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasKaffeeAbo: abo !== "kein" }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="relative p-4 pb-20">
      <AnimatedBackground
        icon="/pic-kaffee.webp"
        glowClass="glow-amber"
        showIcon={false}
      />
      <div className="mb-2 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pic-kaffee.webp"
          alt=""
          className="tab-btn-icon glow-amber"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <h1 className="mb-1 text-center font-cinzel text-3xl text-amber-200">
        Kaffee-Abo
      </h1>
      <p className="mb-6 text-center text-sm text-gray-500">Hauseigene Kaffeemaschine</p>

      {/* Aktuelle Bohnen */}
      <div className="mb-6 rounded-lg border border-amber-600/30 bg-gradient-to-b from-amber-600/10 to-transparent p-4">
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
          AKTUELL IN DER MÜHLE
        </p>
        <p className="mt-1 text-xl font-semibold text-amber-200">
          {currentBeans}
        </p>
        {currentInfo && (
          <div className="mt-3 space-y-2">
            {currentInfo.duftnotizen && (
              <div className="rounded-md border border-amber-600/20 bg-black/30 p-3">
                <p className="font-display text-[9px] font-bold uppercase tracking-widest text-amber-400/80">
                  Duftnoten
                </p>
                <p className="mt-1 text-sm italic text-amber-100">
                  {currentInfo.duftnotizen}
                </p>
              </div>
            )}
            {currentInfo.herkunft && (
              <p className="text-[11px] text-gray-500">
                <span className="text-gray-600">Herkunft:</span>{" "}
                {currentInfo.herkunft}
              </p>
            )}
            {currentInfo.fairtrade && (
              <p className="text-[11px] text-emerald-500">Fair Trade</p>
            )}
          </div>
        )}
        {changedBy && changedAt && (
          <p className="mt-2 text-xs text-gray-600">
            Eingefüllt von {changedBy} ·{" "}
            {new Date(changedAt).toLocaleDateString("de-CH", {
              day: "numeric",
              month: "long",
            })}
          </p>
        )}

        {isRastKaffee && (
          <a
            href={rastShopUrl(currentBeans)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-amber-600/40 bg-amber-600/5 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-600/15"
          >
            Mehr Infos zum Kaffee →
          </a>
        )}

        <button
          onClick={() => setShowSelect(!showSelect)}
          className="mt-2 w-full rounded bg-amber-600/20 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-600/30"
        >
          Bohnen wechseln
        </button>

        {showSelect && (
          <div className="mt-2 space-y-1">
            {rastSortiment.map((k) => (
              <button
                key={k.name}
                onClick={() => applyKaffee(k)}
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

            {/* Eigenen Kaffee erfassen */}
            {!showCustom ? (
              <div className="flex flex-col gap-2">
                <label className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-amber-600/40 bg-amber-600/5 p-3 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-500 hover:bg-amber-600/10">
                  {scanning ? "📷 Scannt…" : "📷 Etikette fotografieren"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScanPhoto}
                    disabled={scanning}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowCustom(true)}
                  className="flex w-full items-center justify-center rounded-lg border border-dashed border-amber-600/40 bg-amber-600/5 p-3 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-500 hover:bg-amber-600/10"
                >
                  + Eigenen Kaffee manuell erfassen
                </button>
                {scanError && (
                  <p className="text-center text-[11px] text-red-400">
                    {scanError}
                  </p>
                )}
              </div>
            ) : (
              <form
                onSubmit={saveCustomKaffee}
                className="rounded-lg border border-amber-600/40 bg-amber-600/5 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    EIGENER KAFFEE
                  </p>
                  <label className="cursor-pointer rounded border border-amber-600/40 bg-amber-600/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-600/20">
                    {scanning ? "📷 Scannt…" : "📷 Etikette scannen"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleScanPhoto}
                      disabled={scanning}
                      className="hidden"
                    />
                  </label>
                </div>
                {scanError && (
                  <p className="mb-2 text-[11px] text-red-400">{scanError}</p>
                )}
                <div className="mb-2">
                  <label className="mb-1 block text-[10px] text-gray-400">
                    Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="z.B. Mocca Supremo"
                    className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-2">
                  <label className="mb-1 block text-[10px] text-gray-400">
                    Herkunft
                  </label>
                  <input
                    type="text"
                    value={customHerkunft}
                    onChange={(e) => setCustomHerkunft(e.target.value)}
                    placeholder="z.B. Äthiopien, Blend..."
                    className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="mb-1 block text-[10px] text-gray-400">
                    Duftnoten
                  </label>
                  <input
                    type="text"
                    value={customDuftnotizen}
                    onChange={(e) => setCustomDuftnotizen(e.target.value)}
                    placeholder="z.B. Schokolade, Nüsse, wenig Säure"
                    className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <label className="mb-3 flex items-center justify-between rounded border border-gray-800 bg-gray-900/40 p-2">
                  <span className="text-[11px] text-gray-300">Fair Trade</span>
                  <button
                    type="button"
                    onClick={() => setCustomFairtrade(!customFairtrade)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      customFairtrade ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        customFairtrade ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded bg-amber-500 py-2 text-xs font-bold text-dark hover:brightness-110"
                  >
                    Einfüllen & speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustom(false);
                      setCustomName("");
                      setCustomHerkunft("");
                      setCustomDuftnotizen("");
                      setCustomFairtrade(false);
                    }}
                    className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Mein Abo — mit Preisen */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
          MONATS-ABO
        </h2>
        <div className="space-y-2">
          {aboOptions.map(({ type, label, price, detail }) => (
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
              <div>
                <p
                  className={`text-sm ${
                    abo === type
                      ? type === "kein"
                        ? "text-gray-400"
                        : "font-semibold text-amber-200"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </p>
                <p className="text-[10px] text-gray-500">{detail}</p>
              </div>
              <div className="text-right">
                {type !== "kein" && (
                  <p
                    className={`font-mono text-sm font-bold ${
                      abo === type ? "text-amber-300" : "text-gray-500"
                    }`}
                  >
                    {price}
                  </p>
                )}
                {abo === type && (
                  <span className="text-xs text-amber-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSaveAbo}
          className={`mt-3 w-full rounded-lg py-2 text-sm font-bold transition-colors ${
            saved
              ? "bg-amber-500/20 text-amber-300"
              : "bg-amber-500 text-dark hover:brightness-110"
          }`}
        >
          {saved ? "Gespeichert!" : "Abo speichern"}
        </button>
      </section>

      {/* Bezahlung */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
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
        <p className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-300">
          INFO
        </p>
        <div className="mt-2 space-y-2 text-sm text-gray-400">
          <p>
            Das Abo deckt die <strong className="text-white">Kosten der Kaffeebohnen</strong>.
            Wir beziehen den Kaffee von Rast Kaffee (Ebikon).
          </p>
          <p>
            Ca. 1× im Jahr geht die Maschine in die{" "}
            <strong className="text-white">Revision</strong> — dieser Betrag kommt separat
            dazu und wird untereinander abgerechnet.
          </p>
          <p>
            Ohne Abo können einzelne Kaffees bezogen werden (50 Rp. / Espresso,
            Bezahlung via Kässeli neben der Maschine).
          </p>
          <p className="text-xs text-amber-200/80">
            Bei Fragen bei <strong>Dällen</strong> melden.
          </p>
        </div>
      </div>
    </div>
  );
}
