"use client";

import { useState } from "react";

interface Artikel {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedBy: string;
  updatedAt: string;
}

const categories = [
  "Allgemein",
  "Technik",
  "Garten",
  "Räume",
  "Kontakte",
  "Regeln",
];

const mockArtikel: Artikel[] = [
  {
    id: "1",
    title: "WLAN",
    content:
      "Netzwerk: The Force\nPasswort: maythefurzbewithyou!\n\nRepeater im 2. OG: gleicher Name, gleiches Passwort.",
    category: "Technik",
    updatedBy: "Yves",
    updatedAt: "2026-01-10",
  },
  {
    id: "2",
    title: "Entsorgung",
    content:
      "Kehricht: jeden Montag bis 7 Uhr rausstellen.\nGrüngut: Dienstag, alle 2 Wochen (gerade KW).\nPapier/Karton: erster Mittwoch im Monat.\nGlas: Container beim Migros Felsenau.\nSperrgut: auf Abruf bei der Stadt Bern (Marke kaufen).\nElektroschrott: Sammelstelle beim Wankdorf.",
    category: "Allgemein",
    updatedBy: "Lena",
    updatedAt: "2026-04-01",
  },
  {
    id: "3",
    title: "Geschichte der Via",
    content:
      "Die Via Felsenau (Spinnereiweg 17) wurde in den 1990er-Jahren als genossenschaftliches Wohnprojekt gegründet. Das Gebäude ist ein Holzbau mit keilförmigem Grundriss, 3 Stockwerke plus Untergeschoss. Charakteristisch ist die Glaspyramide (Wintergarten) im Zentrum, die vom UG bis zum Dach reicht. Der Nord-Flügel hat eine abgerundete Form und ist um einen halben Stock tiefer versetzt als der Ost-Flügel (Hanglage).\n\nAktuell leben ca. 25 Personen in 6 Wohngemeinschaften zusammen.",
    category: "Allgemein",
    updatedBy: "Alain",
    updatedAt: "2026-03-01",
  },
  {
    id: "4",
    title: "Beiträge",
    content:
      "Monatliche Beiträge an die Gemeinschaftskasse:\n- Hausgeld: gemäss Reglement\n- Zusätzliche Beiträge für Gemeinschaftsprojekte werden an der Haussitzung beschlossen\n\nKonto-Infos bei der Verwaltung.",
    category: "Allgemein",
    updatedBy: "Marco",
    updatedAt: "2026-02-15",
  },
  {
    id: "5",
    title: "Kaffee-Abo",
    content:
      "Gemeinsames Kaffee-Abo für die Bar/Gemeinschaftsküche.\nJede:r der:die mitmacht zahlt monatlich einen Beitrag.\nAnmeldung bei Alain oder Sophie.\nAktuell: Bertschi Kaffee, Bern.",
    category: "Allgemein",
    updatedBy: "Sophie",
    updatedAt: "2026-03-10",
  },
  {
    id: "6",
    title: "Unser Biotop",
    content:
      "Das Biotop befindet sich südlich vom Hauptgebäude. Es ist ein kleiner Naturteich mit einheimischen Pflanzen.\n\nRegeln:\n- Kein Baden\n- Keine Fische einsetzen\n- Uferbepflanzung nicht entfernen\n- Laub im Herbst abfischen",
    category: "Garten",
    updatedBy: "Sven",
    updatedAt: "2026-03-20",
  },
  {
    id: "7",
    title: "Unsere Verwaltung",
    content:
      "Die Via wird genossenschaftlich verwaltet.\n\nVorstand:\n- Präsident: Marco\n- Finanzen: Lena\n- Hauswart: Alain\n\nHaussitzungen: monatlich (siehe Termine)\nBeschlüsse werden im Protokoll festgehalten.",
    category: "Kontakte",
    updatedBy: "Marco",
    updatedAt: "2026-04-05",
  },
  {
    id: "8",
    title: "Maschinenpark",
    content:
      "Rasenmäher (Benzin): Geräteschuppen\nHeckenschere (Akku): Geräteschuppen\nKettensäge: nur mit Bewilligung, bei Alain\nBohrmaschine + Werkzeugkoffer: Werkraum UG\nHochdruckreiniger: Geräteschuppen\n\nBitte nach Gebrauch reinigen und zurückstellen.",
    category: "Technik",
    updatedBy: "Alain",
    updatedAt: "2026-03-25",
  },
  {
    id: "9",
    title: "Gemüsegarten",
    content:
      "Parzellen hinter dem Haus. Jede WG hat ein Beet.\nGemeinsam: Kräuterbeet, Beerensträucher.\n\nRegeln:\n- Eigenes Beet selber pflegen\n- Gemeinschaftsbeete nach Absprache\n- Kompost: nur Gartenabfälle, keine Essensreste\n- Wasser: Regentonne nutzen wenn möglich",
    category: "Garten",
    updatedBy: "Ruth",
    updatedAt: "2026-03-15",
  },
  {
    id: "10",
    title: "Baupläne",
    content:
      "Die originalen Baupläne des Hauses sind bei der Verwaltung einsehbar.\nDigitale Kopien auf Anfrage bei Marco.\n\nWichtige Infos:\n- Tragende Wände: NICHT verändern ohne Bewilligung\n- Brandschutzwände: rot markiert in den Plänen\n- Leitungsplan (Wasser/Strom): im Technikraum UG",
    category: "Technik",
    updatedBy: "Marco",
    updatedAt: "2026-01-20",
  },
];

export default function HausbuchPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [articles, setArticles] = useState(mockArtikel);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Allgemein");

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Alle" || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setArticles((prev) => [
      {
        id: String(Date.now()),
        title: newTitle,
        content: newContent,
        category: newCategory,
        updatedBy: "Alain",
        updatedAt: new Date().toISOString().split("T")[0]!,
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewContent("");
    setShowCreate(false);
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-4 flex items-center justify-between pr-12">
        <h1 className="font-display text-2xl font-bold uppercase text-accent">
          HAUSBUCH
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-full bg-accent px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-dark"
        >
          + Neuer Eintrag
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Alles Wissenswerte rund ums Haus
      </p>

      {/* Suche */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen..."
        className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
      />

      {/* Kategorien */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["Alle", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              selectedCategory === cat
                ? "bg-accent text-dark"
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Erstellen */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Titel</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Waschmaschine bedienen"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">
              Kategorie
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Inhalt</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Beschreibung, Anleitung, Infos..."
              rows={4}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 font-mono text-xs font-bold text-dark"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Artikel-Liste */}
      <div className="space-y-2">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40"
          >
            <button
              onClick={() =>
                setExpanded(expanded === a.id ? null : a.id)
              }
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div>
                <h3 className="font-medium text-white">{a.title}</h3>
                <span className="font-mono text-xs text-accent">
                  {a.category}
                </span>
              </div>
              <span className="text-gray-500">
                {expanded === a.id ? "▲" : "▼"}
              </span>
            </button>
            {expanded === a.id && (
              <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                <p className="whitespace-pre-line text-sm text-gray-300">
                  {a.content}
                </p>
                <p className="mt-3 text-xs text-gray-600">
                  Aktualisiert von {a.updatedBy} ·{" "}
                  {new Date(a.updatedAt).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-gray-600">
          Kein Eintrag gefunden.
        </p>
      )}
    </div>
  );
}
