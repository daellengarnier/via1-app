// Mock-Daten fuer die Bewohnende-Uebersicht
// Spaeter: aus der DB laden

export type RoomType =
  | "zimmer"
  | "bad"
  | "wc"
  | "bad_wc"
  | "wohnkueche"
  | "balkon";

export interface Resident {
  id: string;
  name: string;
  movedIn: string;
  movedOut?: string;
}

export interface Work {
  id: string;
  type: "boden_schleifen" | "streichen" | "reparatur" | "reinigung" | "anderes";
  description: string;
  date: string;
  performedBy?: string;
}

export interface Damage {
  id: string;
  description: string;
  severity: "klein" | "mittel" | "gross";
  reportedAt: string;
  resolvedAt?: string;
  photoCount: number;
}

export interface Handover {
  id: string;
  date: string;
  from?: string; // Vorgaenger
  to?: string; // Nachfolger
  notes: string;
  damageCount: number;
}

export interface Room {
  id: string;
  keyNumber: string; // z.B. "N01"
  label: string; // z.B. "Zimmer 1", "Bad", "Wohnkueche"
  type: RoomType;
  keyCount: number;
  currentResident?: Resident;
  residentHistory: Resident[];
  handovers: Handover[];
  works: Work[];
  damages: Damage[];
}

export interface Wg {
  slug: string;
  name: string;
  floor: string;
  floorNum: 0 | 1 | 2;
  side: "nord" | "ost";
  rooms: Room[];
}

// Hilfsfunktion fuer Mock-Raeume. 'prefix' ist 2 Zeichen wie "N0",
// "N1", "O2" etc. und setzt sich zusammen aus Seite (N/O) und
// Stockwerk (0/1/2). Die Raum-Nummer wird einfach angehaengt, was
// Raum-Keys wie N01, N11, O21 ergibt — passend zur Seed-Daten-DB.
function makeRooms(
  prefix: string,
  zimmerCount: number,
  combinedBadWc: boolean,
  withBalkon: boolean
): Room[] {
  const rooms: Room[] = [];

  for (let i = 1; i <= zimmerCount; i++) {
    rooms.push({
      id: `${prefix}${i}`,
      keyNumber: `${prefix}${i}`,
      label: `Zimmer ${i}`,
      type: "zimmer",
      keyCount: 2,
      currentResident: i === 1
        ? {
            id: `r-${prefix}${i}`,
            name: "Muster Person",
            movedIn: "2024-08-01",
          }
        : undefined,
      residentHistory: [],
      handovers: [],
      works: [],
      damages: [],
    });
  }

  if (combinedBadWc) {
    rooms.push({
      id: `${prefix}-badwc`,
      keyNumber: `${prefix}-BWC`,
      label: "Bad & WC",
      type: "bad_wc",
      keyCount: 0,
      residentHistory: [],
      handovers: [],
      works: [],
      damages: [],
    });
  } else {
    rooms.push({
      id: `${prefix}-bad`,
      keyNumber: `${prefix}-BAD`,
      label: "Bad",
      type: "bad",
      keyCount: 0,
      residentHistory: [],
      handovers: [],
      works: [],
      damages: [],
    });
    rooms.push({
      id: `${prefix}-wc`,
      keyNumber: `${prefix}-WC`,
      label: "WC",
      type: "wc",
      keyCount: 0,
      residentHistory: [],
      handovers: [],
      works: [],
      damages: [],
    });
  }

  rooms.push({
    id: `${prefix}-wk`,
    keyNumber: `${prefix}-WK`,
    label: "Wohnkueche",
    type: "wohnkueche",
    keyCount: 0,
    residentHistory: [],
    handovers: [],
    works: [],
    damages: [],
  });

  if (withBalkon) {
    rooms.push({
      id: `${prefix}-balkon`,
      keyNumber: `${prefix}-BAL`,
      label: "Balkon / Terrasse",
      type: "balkon",
      keyCount: 0,
      residentHistory: [],
      handovers: [],
      works: [],
      damages: [],
    });
  }

  return rooms;
}

export const wgs: Wg[] = [
  {
    slug: "nordwind",
    name: "Nordwind",
    floor: "EG Nord",
    floorNum: 0,
    side: "nord",
    rooms: makeRooms("N0", 5, false, false),
  },
  {
    slug: "ostblock",
    name: "Ostblock",
    floor: "EG Ost",
    floorNum: 0,
    side: "ost",
    rooms: makeRooms("O0", 5, false, false),
  },
  {
    slug: "dreiecksbar",
    name: "Dreiecksbar",
    floor: "1. OG Nord",
    floorNum: 1,
    side: "nord",
    rooms: makeRooms("N1", 5, false, false),
  },
  {
    slug: "kleenex",
    name: "Kleenex",
    floor: "1. OG Ost",
    floorNum: 1,
    side: "ost",
    rooms: makeRooms("O1", 5, false, false),
  },
  {
    slug: "family-wg",
    name: "Family-WG",
    floor: "2. OG Nord",
    floorNum: 2,
    side: "nord",
    rooms: makeRooms("N2", 5, true, true),
  },
  {
    slug: "bonzen",
    name: "Bonzen",
    floor: "2. OG Ost",
    floorNum: 2,
    side: "ost",
    rooms: makeRooms("O2", 4, true, true),
  },
];

export const roomTypeLabels: Record<RoomType, string> = {
  zimmer: "Schlafzimmer",
  bad: "Bad",
  wc: "WC",
  bad_wc: "Bad & WC",
  wohnkueche: "Wohnkueche",
  balkon: "Balkon / Terrasse",
};

export const roomTypeIcons: Record<RoomType, string> = {
  zimmer: "🛏",
  bad: "🛁",
  wc: "🚽",
  bad_wc: "🛁",
  wohnkueche: "🍳",
  balkon: "🌿",
};

export const workTypeLabels: Record<Work["type"], string> = {
  boden_schleifen: "Boden geschliffen",
  streichen: "Gestrichen",
  reparatur: "Reparatur",
  reinigung: "Reinigung",
  anderes: "Anderes",
};
