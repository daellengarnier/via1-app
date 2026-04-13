"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Traktandum {
  id: string;
  title: string;
  notes: string;
  createdBy: string;
}

interface Guest {
  diet: string;
  allergies: string;
}

interface MealSignup {
  name: string;
  diet: string;
  allergies: string;
  guestDetails: Guest[];
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
  protokollfuehrung: string;
  anwesend: string[];
  abgemeldet: string[];
  traktanden: Traktandum[];
  mealSignups: MealSignup[];
}

// Alle Bewohner:innen (Mock — später aus DB)
const ALL_RESIDENTS = [
  "Alain", "Yves", "Sophie", "Dario", "Marco", "Lena", "Sven", "Mia",
  "Nina", "Tim", "Nora", "Fabio", "Lea", "Jan", "Anna", "Lars", "Vera",
  "Thomas", "Sarah", "Ruth", "Beat", "Maja", "Felix", "Claudia", "Martin",
  "Lia",
];

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
    protokollfuehrung: "",
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
      { name: "Alain", diet: "Fleisch", allergies: "", guestDetails: [] },
      {
        name: "Sophie",
        diet: "Vegi",
        allergies: "",
        guestDetails: [{ diet: "Fleisch", allergies: "Laktose" }],
      },
      { name: "Marco", diet: "Fleisch", allergies: "", guestDetails: [] },
      { name: "Nina", diet: "Vegan", allergies: "Nüsse", guestDetails: [] },
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
    protokollfuehrung: "",
    anwesend: [],
    abgemeldet: [],
    traktanden: [],
    mealSignups: [
      { name: "Alain", diet: "Fleisch", allergies: "", guestDetails: [] },
      {
        name: "Yves",
        diet: "Fleisch",
        allergies: "",
        guestDetails: [
          { diet: "Vegi", allergies: "" },
          { diet: "Vegan", allergies: "Gluten" },
        ],
      },
      { name: "Sophie", diet: "Vegi", allergies: "", guestDetails: [] },
      { name: "Lena", diet: "Vegan", allergies: "", guestDetails: [] },
      {
        name: "Felix",
        diet: "Fleisch",
        allergies: "",
        guestDetails: [{ diet: "Fleisch", allergies: "" }],
      },
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
    protokollfuehrung: "Lena",
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
  const [signupGuestDetails, setSignupGuestDetails] = useState<Guest[]>([]);
  const [attendanceMode, setAttendanceMode] = useState<
    "anwesend" | "abgemeldet" | null
  >(null);
  const [deleteTraktandumId, setDeleteTraktandumId] = useState<string | null>(
    null
  );
  const [locationMode, setLocationMode] = useState<"wg" | "custom">("custom");

  // Aus Profil (Mock)
  const myDiet = "Fleisch";
  const myAllergies = "";

  const WG_OPTIONS = [
    "Nordwind",
    "Ostblock",
    "Dreiecksbar",
    "Kleenex",
    "Family-WG",
    "Bonzen",
  ];

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
    (sum, s) => sum + 1 + s.guestDetails.length,
    0
  );

  // Diät-Zusammenfassung
  const dietCounts = { Fleisch: 0, Vegi: 0, Vegan: 0, Andere: 0 };
  termin.mealSignups.forEach((s) => {
    const add = (d: string) => {
      if (d === "Fleisch") dietCounts.Fleisch++;
      else if (d === "Vegi") dietCounts.Vegi++;
      else if (d === "Vegan") dietCounts.Vegan++;
      else dietCounts.Andere++;
    };
    add(s.diet);
    s.guestDetails.forEach((g) => add(g.diet));
  });

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
        {
          name: "Alain",
          diet: myDiet,
          allergies: myAllergies,
          guestDetails: signupGuestDetails,
        },
      ],
    });
    setShowSignup(false);
    setSignupGuestDetails([]);
  }

  function addGuest() {
    setSignupGuestDetails((prev) => [
      ...prev,
      { diet: "Fleisch", allergies: "" },
    ]);
  }

  function removeGuest(index: number) {
    setSignupGuestDetails((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGuest(index: number, field: keyof Guest, value: string) {
    setSignupGuestDetails((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  function toggleAttendance(name: string, mode: "anwesend" | "abgemeldet") {
    if (!termin) return;
    const key = mode;
    const otherKey = mode === "anwesend" ? "abgemeldet" : "anwesend";
    const current = termin[key];
    const isIn = current.includes(name);
    setTermin({
      ...termin,
      [key]: isIn ? current.filter((n) => n !== name) : [...current, name],
      // Aus der anderen Liste entfernen falls dort
      [otherKey]: termin[otherKey].filter((n) => n !== name),
    });
  }

  function deleteTraktandum(tId: string) {
    if (!termin) return;
    setTermin({
      ...termin,
      traktanden: termin.traktanden.filter((t) => t.id !== tId),
    });
    setDeleteTraktandumId(null);
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
    if (termin.protokollfuehrung)
      lines.push(`Protokollführung: ${termin.protokollfuehrung}`);
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
        className="mb-4 ml-14 text-sm text-gray-500 hover:text-white"
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
        <h1 className="mt-1 text-lg font-medium text-white">
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
          {/* Sitzungsleitung & Protokollführung */}
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
                Protokollführung
              </label>
              <input
                type="text"
                value={termin.protokollfuehrung}
                onChange={(e) =>
                  setTermin({ ...termin, protokollfuehrung: e.target.value })
                }
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Sitzungsort */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="block font-mono text-xs text-gray-500">
                Sitzungsort
              </label>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setLocationMode("wg")}
                  className={`rounded px-2 py-0.5 font-mono uppercase ${
                    locationMode === "wg"
                      ? "bg-accent text-dark"
                      : "border border-gray-700 text-gray-500"
                  }`}
                >
                  WG
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode("custom")}
                  className={`rounded px-2 py-0.5 font-mono uppercase ${
                    locationMode === "custom"
                      ? "bg-accent text-dark"
                      : "border border-gray-700 text-gray-500"
                  }`}
                >
                  Anderer Ort
                </button>
              </div>
            </div>
            {locationMode === "wg" ? (
              <div className="grid grid-cols-3 gap-2">
                {WG_OPTIONS.map((wg) => (
                  <button
                    key={wg}
                    type="button"
                    onClick={() => setTermin({ ...termin, location: wg })}
                    className={`rounded border px-2 py-2 text-xs transition-colors ${
                      termin.location === wg
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {wg}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={termin.location}
                onChange={(e) =>
                  setTermin({ ...termin, location: e.target.value })
                }
                placeholder="z.B. Innenhof, Pyramide, …"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              />
            )}
          </div>

          {/* Anwesend / Abgemeldet */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAttendanceMode("anwesend")}
              className="rounded-lg border border-gray-800 bg-white/5 p-3 text-left transition-colors hover:border-accent/40"
            >
              <p className="mb-1 font-mono text-xs text-accent">
                Anwesend ({termin.anwesend.length})
              </p>
              <p className="line-clamp-3 text-xs text-gray-400">
                {termin.anwesend.join(", ") || "Tippe zum Auswählen…"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAttendanceMode("abgemeldet")}
              className="rounded-lg border border-gray-800 bg-white/5 p-3 text-left transition-colors hover:border-secondary/40"
            >
              <p className="mb-1 font-mono text-xs text-secondary">
                Abgemeldet ({termin.abgemeldet.length})
              </p>
              <p className="line-clamp-3 text-xs text-gray-400">
                {termin.abgemeldet.join(", ") || "Tippe zum Auswählen…"}
              </p>
            </button>
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
                  className="rounded-lg border border-gray-800 bg-white/5 p-3"
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
                    <button
                      type="button"
                      onClick={() => setDeleteTraktandumId(t.id)}
                      className="text-lg leading-none text-gray-600 hover:text-red-400"
                      aria-label="Traktandum löschen"
                    >
                      ×
                    </button>
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

          {/* Diät-Zusammenfassung */}
          {totalGuests > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {dietCounts.Fleisch > 0 && (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
                  🍖 {dietCounts.Fleisch} Fleisch
                </span>
              )}
              {dietCounts.Vegi > 0 && (
                <span className="rounded-full bg-lime-500/15 px-3 py-1 text-xs text-lime-300">
                  🥗 {dietCounts.Vegi} Vegi
                </span>
              )}
              {dietCounts.Vegan > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  🌱 {dietCounts.Vegan} Vegan
                </span>
              )}
              {dietCounts.Andere > 0 && (
                <span className="rounded-full bg-gray-500/15 px-3 py-1 text-xs text-gray-300">
                  {dietCounts.Andere} Andere
                </span>
              )}
            </div>
          )}

          {showSignup && (
            <form
              onSubmit={handleMealSignup}
              className="mb-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3"
            >
              <p className="mb-3 text-xs text-gray-400">
                Deine Ernährung ({myDiet}) wird automatisch aus deinem Profil
                übernommen.
              </p>

              {/* Gäste */}
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Gäste mitbringen ({signupGuestDetails.length})
                </p>
                <button
                  type="button"
                  onClick={addGuest}
                  className="rounded bg-secondary/20 px-2 py-1 text-xs text-secondary hover:bg-secondary/30"
                >
                  + Gast
                </button>
              </div>

              {signupGuestDetails.map((g, i) => (
                <div
                  key={i}
                  className="mb-2 rounded border border-secondary/20 bg-white/5 p-2"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      Gast {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGuest(i)}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      entfernen
                    </button>
                  </div>
                  <div className="mb-1.5 flex gap-1.5">
                    {["Fleisch", "Vegi", "Vegan"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateGuest(i, "diet", d)}
                        className={`flex-1 rounded py-1 font-mono text-[10px] transition-colors ${
                          g.diet === d
                            ? "bg-secondary text-white"
                            : "border border-gray-700 text-gray-400"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={g.allergies}
                    onChange={(e) =>
                      updateGuest(i, "allergies", e.target.value)
                    }
                    placeholder="Allergien (optional)"
                    className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-secondary focus:outline-none"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="mt-2 rounded bg-secondary px-4 py-2 font-mono text-xs font-bold text-white"
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
                className="rounded-lg border border-gray-800 bg-white/5 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{s.name}</span>
                  <span className="font-mono text-xs text-gray-500">
                    {s.diet}
                    {s.allergies && ` · ${s.allergies}`}
                  </span>
                </div>
                {s.guestDetails.length > 0 && (
                  <div className="mt-1 space-y-0.5 border-t border-gray-800 pt-1">
                    {s.guestDetails.map((g, gi) => (
                      <div
                        key={gi}
                        className="flex items-center justify-between text-xs text-gray-400"
                      >
                        <span>+ Gast {gi + 1}</span>
                        <span className="font-mono text-gray-600">
                          {g.diet}
                          {g.allergies && ` · ${g.allergies}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Anwesenheits-Modal */}
      {attendanceMode && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setAttendanceMode(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-800 bg-black p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                {attendanceMode === "anwesend" ? "Anwesend" : "Abgemeldet"}
              </h3>
              <button
                onClick={() => setAttendanceMode(null)}
                className="text-gray-500 hover:text-white"
                aria-label="Schliessen"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Tippe auf einen Namen zum Umschalten.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_RESIDENTS.map((name) => {
                const list =
                  attendanceMode === "anwesend"
                    ? termin.anwesend
                    : termin.abgemeldet;
                const selected = list.includes(name);
                const activeColor =
                  attendanceMode === "anwesend"
                    ? "bg-accent text-dark border-accent"
                    : "bg-secondary text-white border-secondary";
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAttendance(name, attendanceMode)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      selected
                        ? activeColor
                        : "border-gray-700 bg-white/5 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Traktandum löschen — Bestätigung */}
      {deleteTraktandumId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTraktandumId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-800 bg-black p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-semibold text-white">
              Traktandum löschen?
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Willst du dieses Traktandum wirklich löschen? Das kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTraktandumId(null)}
                className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-300 hover:border-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={() => deleteTraktandum(deleteTraktandumId)}
                className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
