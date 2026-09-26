// Individuelle Anordnung des Home-Screens pro Person.
//
// Der Waesche-Timer und der Header sind fix; alle anderen Kacheln sind
// Bloecke, die verschoben oder ausgeblendet werden koennen. Trennlinien
// sind normale Bloecke (bis zu drei). Gespeichert in users.homeLayout
// (JSON), damit die Anordnung auf allen Geraeten gleich ist.

export const HOME_BLOCK_IDS = [
  "termin",
  "aktivitaet",
  "sauna",
  "aufgaben",
  "putzen",
  "kochen",
  "kaffee",
  "spinnerei",
  "pinnwand",
  "divider-1",
  "divider-2",
  "divider-3",
] as const;

export type HomeBlockId = (typeof HOME_BLOCK_IDS)[number];

export const LIST_COUNTS = [1, 3, 5] as const;
export type ListCount = (typeof LIST_COUNTS)[number];

export const KOCHPLAN_DAYS = [1, 2, 3] as const;
export type KochplanDays = (typeof KOCHPLAN_DAYS)[number];

export interface HomeLayout {
  order: HomeBlockId[];
  hidden: HomeBlockId[];
  // Wie viele kommende Termine / Aktivitaeten die Kachel zeigt.
  termineCount: ListCount;
  aktivitaetenCount: ListCount;
  // Wie viele Tage die Kochplan-Kachel zeigt (heute, morgen, ...).
  kochplanDays: KochplanDays;
}

// Standard = die bisherige Reihenfolge.
export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  order: [
    "termin",
    "aktivitaet",
    "sauna",
    "aufgaben",
    "putzen",
    "divider-1",
    "kochen",
    "kaffee",
    "spinnerei",
    "pinnwand",
    "divider-2",
    "divider-3",
  ],
  hidden: ["divider-2", "divider-3"],
  termineCount: 1,
  aktivitaetenCount: 1,
  kochplanDays: 1,
};

export const HOME_BLOCK_LABELS: Record<HomeBlockId, string> = {
  termin: "Termine",
  aktivitaet: "Aktivitäten",
  sauna: "Sauna",
  aufgaben: "Aufgaben",
  putzen: "Putzen",
  kochen: "Kochplan",
  kaffee: "Kaffeemühle",
  spinnerei: "Spinnerei",
  pinnwand: "Pinnwand",
  "divider-1": "Trennlinie",
  "divider-2": "Trennlinie",
  "divider-3": "Trennlinie",
};

function isBlockId(v: unknown): v is HomeBlockId {
  return typeof v === "string" && (HOME_BLOCK_IDS as readonly string[]).includes(v);
}

function toCount(v: unknown, fallback: ListCount): ListCount {
  return v === 1 || v === 3 || v === 5 ? v : fallback;
}

function toDays(v: unknown, fallback: KochplanDays): KochplanDays {
  return v === 1 || v === 2 || v === 3 ? v : fallback;
}

// Macht aus beliebigem (gespeichertem oder geschicktem) JSON ein
// vollstaendiges Layout: unbekannte IDs raus, fehlende Bloecke hinten
// in Default-Reihenfolge anhaengen, Duplikate entfernen.
export function normalizeHomeLayout(raw: unknown): HomeLayout {
  const d = DEFAULT_HOME_LAYOUT;
  if (!raw || typeof raw !== "object") return { ...d, order: [...d.order], hidden: [...d.hidden] };
  const o = raw as Partial<Record<keyof HomeLayout, unknown>>;

  const seen = new Set<HomeBlockId>();
  const order: HomeBlockId[] = [];
  for (const id of Array.isArray(o.order) ? o.order : []) {
    if (isBlockId(id) && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  for (const id of d.order) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }

  const hidden = (Array.isArray(o.hidden) ? o.hidden : d.hidden).filter(isBlockId);

  return {
    order,
    hidden: Array.from(new Set(hidden)),
    termineCount: toCount(o.termineCount, d.termineCount),
    aktivitaetenCount: toCount(o.aktivitaetenCount, d.aktivitaetenCount),
    kochplanDays: toDays(o.kochplanDays, d.kochplanDays),
  };
}
