"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Traktandum {
  id: string;
  title: string;
  notes: string;
  createdBy: string;
}

interface MealSignup {
  name: string;
  diet: string;
  guests: number;
}

interface TerminDetail {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "sitzung" | "essen" | "sonstige";
  organizer: string | null;
  withDinner: boolean;
  dinnerTime: string | null;
  sitzungsleitung: string;
  protokoll: string;
  anwesend: string[];
  abgemeldet: string[];
  traktanden: Traktandum[];
  mealSignups: MealSignup[];
}

const mockTermine: Record<string, TerminDetail> = {
  "1": {
    id: "1",
    title: "Haussitzung April",
    date: "2026-04-16",
    time: "19:30",
    location: "Gemeinschaftsraum EG",
    type: "sitzung",
    organizer: "Dreiecksbar",
    withDinner: true,
    dinnerTime: "18:30",
    sitzungsleitung: "Alain",
    protokoll: "",
    anwesend: [
      "Alain",
      "Yves",
      "Sophie",
      "Dario",
      "Marco",
      "Lena",
      "Nina",
      "Felix",
    ],
    abgemeldet: ["Thomas", "Ruth"],
    traktanden: [
      {
        id: "t1",
        title: "Gartenplanung Sommer",
        notes: "",
        createdBy: "Alain",
      },
      {
        id: "t2",
        title: "Waschküche-Regeln",
        notes: "",
        createdBy: "Nina",
      },
      {
        id: "t3",
        title: "Sauna-Zeiten anpassen",
        notes: "",
        createdBy: "Felix",
      },
    ],
    mealSignups: [
      { name: "Alain", diet: "Fleisch", guests: 0 },
      { name: "Sophie", diet: "Vegi", guests: 1 },
      { name: "Marco", diet: "Fleisch", guests: 0 },
      { name: "Nina", diet: "Vegan", guests: 0 },
    ],
  },
  "2": {
    id: "2",
    title: "Hausessen Frühling",
    date: "2026-04-25",
    time: "18:00",
    location: "Innenhof",
    type: "essen",
    organizer: null,
    withDinner: false,
    dinnerTime: null,
    sitzungsleitung: "",
    protokoll: "",
    anwesend: [],
    abgemeldet: [],
    traktanden: [],
    mealSignups: [
      { name: "Alain", diet: "Fleisch", guests: 0 },
      { name: "Yves", diet: "Fleisch", guests: 2 },
      { name: "Sophie", diet: "Vegi", guests: 0 },
      { name: "Lena", diet: "Vegan", guests: 0 },
      { name: "Felix", diet: "Fleisch", guests: 1 },
    ],
  },
  "3": {
    id: "3",
    title: "Haussitzung März",
    date: "2026-03-19",
    time: "19:30",
    location: "Gemeinschaftsraum EG",
    type: "sitzung",
    organizer: "Nordwind",
    withDinner: false,
    dinnerTime: null,
    sitzungsleitung: "Marco",
    protokoll: "Alle Punkte wurden besprochen. Nächste Sitzung im April.",
    anwesend: [
      "Marco",
      "Lena",
      "Sven",
      "Alain",
      "Sophie",
      "Nina",
      "Jan",
      "Felix",
      "Claudia",
    ],
    abgemeldet: ["Yves", "Dario"],
    traktanden: [
      {
        id: "t4",
        title: "Budget 2026",
        notes: "Budget wurde genehmigt. CHF 5000 für Gemeinschaftsraum.",
        createdBy: "Marco",
      },
      {
        id: "t5",
        title: "Neuer Putzplan",
        notes:
          "Rotation bleibt gleich. Kontrolle wird eingeführt.",
        createdBy: "Lena",
      },
      {
        id: "t6",
        title: "Fahrradraum aufräumen",
        notes: "Termin: 22. März, 10 Uhr. Alle sind eingeladen.",
        createdBy: "Sven",
      },
      {
        id: "t7",
        title: "Gästewohnwagen Saison",
        notes: "Ab April buchbar. Preise bleiben gleich.",
        createdBy: "Felix",
      },
      {
        id: "t8",
        title: "Varia",
        notes: "Keine weiteren Punkte.",
        createdBy: "Marco",
      },
    ],
    mealSignups: [],
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TerminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const initial = mockTermine[id];
  const [termin, setTermin] = useState<TerminDetail | null>(initial ?? null);
  const [newTraktandum, setNewTraktandum] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupDiet, setSignupDiet] = useState("Fleisch");
  const [signupGuests, setSignupGuests] = useState(0);

  if (!termin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-400">Termin nicht gefunden.</p>
      </div>
    );
  }

  const isSitzung = termin.type === "sitzung";
  const hasEssen = termin.type === "essen" || termin.withDinner;
  const totalGuests = termin.mealSignups.reduce(
    (sum, s) => sum + 1 + s.guests,
    0
  );

  function addTraktandum(e: React.FormEvent) {
    e.preventDefault();
    if (!newTraktandum.trim() || !termin) return;
    setTermin({
      ...termin,
      traktanden: [
        ...termin.traktanden,
        {
          id: String(Date.now()),
          title: newTraktandum,
          notes: "",
          createdBy: "Alain",
        },
      ],
    });
    setNewTraktandum("");
  }

  function updateTraktandumNotes(tId: string, notes: string) {
    if (!termin) return;
    setTermin({
      ...termin,
      traktanden: termin.traktanden.map((t) =>
        t.id === tId ? { ...t, notes } : t
      ),
    });
  }

  function handleMealSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!termin) return;
    setTermin({
      ...termin,
      mealSignups: [
        ...termin.mealSignups,
        { name: "Alain", diet: signupDiet, guests: signupGuests },
      ],
    });
    setShowSignup(false);
    setSignupGuests(0);
  }

  function exportPdf() {
    if (!termin) return;
    const lines: string[] = [];
    lines.push(`SITZUNGSPROTOKOLL`);
    lines.push(`==================`);
    lines.push(``);
    lines.push(`${termin.title}`);
    lines.push(`Datum: ${formatDate(termin.date)}, ${termin.time}`);
    lines.push(`Ort: ${termin.location}`);
    if (termin.organizer) lines.push(`Organisiert von: ${termin.organizer}`);
    if (termin.sitzungsleitung)
      lines.push(`Sitzungsleitung: ${termin.sitzungsleitung}`);
    lines.push(``);
    lines.push(`Anwesend: ${termin.anwesend.join(", ") || "–"}`);
    lines.push(`Abgemeldet: ${termin.abgemeldet.join(", ") || "–"}`);
    lines.push(``);
    lines.push(`TRAKTANDEN`);
    lines.push(`----------`);
    termin.traktanden.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.title}`);
      if (t.notes) lines.push(`   ${t.notes}`);
      lines.push(``);
    });
    if (termin.protokoll) {
      lines.push(`PROTOKOLL`);
      lines.push(`---------`);
      lines.push(termin.protokoll);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${termin.title.replace(/\s+/g, "_")}_Protokoll.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <button
        onClick={() => router.push("/termine")}
        className="mb-4 text-sm text-gray-500 hover:text-white"
      >
        ← Termine
      </button>

      <div className="mb-6">
        <span
          className={`font-mono text-xs uppercase ${
            isSitzung ? "text-accent" : termin.type === "essen" ? "text-secondary" : "text-gray-400"
          }`}
        >
          {isSitzung ? "Sitzung" : termin.type === "essen" ? "Essen" : "Sonstige"}
        </span>
        {termin.organizer && (
          <span className="ml-2 text-xs text-gray-600">
            {termin.organizer}
          </span>
        )}
        <h1 className="mt-1 font-heading text-2xl text-white">
          {termin.title}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {formatDate(termin.date)} · {termin.time}
        </p>
        <p className="text-sm text-gray-500">{termin.location}</p>
        {termin.withDinner && termin.dinnerTime && (
          <p className="mt-1 text-sm text-secondary">
            Abendessen um {termin.dinnerTime}
          </p>
        )}
      </div>

      {/* Sitzungs-Template (nur bei Sitzung) */}
      {isSitzung && (
        <>
          {/* Sitzungsleitung & Ort */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-xs text-gray-500">
                Sitzungsleitung
              </label>
              <input
                type="text"
                value={termin.sitzungsleitung}
                onChange={(e) =>
                  setTermin({ ...termin, sitzungsleitung: e.target.value })
                }
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-gray-500">
                Sitzungsort
              </label>
              <input
                type="text"
                value={termin.location}
                onChange={(e) =>
                  setTermin({ ...termin, location: e.target.value })
                }
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Anwesend / Abgemeldet */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="mb-1 font-mono text-xs text-accent">
                Anwesend ({termin.anwesend.length})
              </p>
              <p className="text-xs text-gray-400">
                {termin.anwesend.join(", ") || "–"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
              <p className="mb-1 font-mono text-xs text-secondary">
                Abgemeldet ({termin.abgemeldet.length})
              </p>
              <p className="text-xs text-gray-400">
                {termin.abgemeldet.join(", ") || "–"}
              </p>
            </div>
          </div>

          {/* Traktanden */}
          <section className="mb-6">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
              Traktanden
            </h2>
            <div className="space-y-3">
              {termin.traktanden.map((t, i) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono text-xs font-bold text-accent">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        von {t.createdBy}
                      </p>
                      <textarea
                        value={t.notes}
                        onChange={(e) =>
                          updateTraktandumNotes(t.id, e.target.value)
                        }
                        placeholder="Notizen / Was wurde besprochen..."
                        rows={2}
                        className="mt-2 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Neues Traktandum */}
            <form onSubmit={addTraktandum} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTraktandum}
                onChange={(e) => setNewTraktandum(e.target.value)}
                placeholder="Neues Traktandum..."
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-accent px-3 py-2 font-mono text-xs font-bold text-dark"
              >
                +
              </button>
            </form>
          </section>

          {/* Allgemeines Protokoll */}
          <section className="mb-6">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent">
              Protokoll
            </h2>
            <textarea
              value={termin.protokoll}
              onChange={(e) =>
                setTermin({ ...termin, protokoll: e.target.value })
              }
              placeholder="Allgemeine Notizen, Beschlüsse, nächste Schritte..."
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
            />
          </section>

          {/* PDF Export */}
          <button
            onClick={exportPdf}
            className="mb-6 w-full rounded-lg border border-accent/30 bg-accent/5 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Protokoll exportieren (TXT)
          </button>
        </>
      )}

      {/* Essens-Anmeldung (bei Essen oder Sitzung mit Dinner) */}
      {hasEssen && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-secondary">
              Essens-Anmeldung ({totalGuests} Personen)
            </h2>
            <button
              onClick={() => setShowSignup(!showSignup)}
              className="rounded-full bg-secondary px-3 py-1 font-mono text-xs font-bold text-white"
            >
              Anmelden
            </button>
          </div>

          {showSignup && (
            <form
              onSubmit={handleMealSignup}
              className="mb-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3"
            >
              <div className="mb-2">
                <label className="mb-1 block text-xs text-gray-400">
                  Ernährung
                </label>
                <div className="flex gap-2">
                  {["Fleisch", "Vegi", "Vegan"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSignupDiet(d)}
                      className={`flex-1 rounded py-1.5 font-mono text-xs transition-colors ${
                        signupDiet === d
                          ? "bg-secondary text-white"
                          : "border border-gray-700 text-gray-400"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-400">
                  Gäste mitbringen
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={signupGuests}
                  onChange={(e) => setSignupGuests(Number(e.target.value))}
                  className="w-20 rounded border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white focus:border-secondary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded bg-secondary px-4 py-2 font-mono text-xs font-bold text-white"
              >
                Anmelden
              </button>
            </form>
          )}

          {/* Anmeldungsliste */}
          <div className="space-y-1">
            {termin.mealSignups.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2"
              >
                <span className="text-sm text-white">
                  {s.name}
                  {s.guests > 0 && (
                    <span className="text-xs text-gray-500">
                      {" "}
                      +{s.guests}
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs text-gray-500">
                  {s.diet}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
