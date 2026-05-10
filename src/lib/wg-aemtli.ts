// Default-Aemtli die beim ersten Aufruf einer WG angelegt werden,
// falls noch keine existieren. 4 verpflichtende plus eines optionales
// Beispiel.
export const DEFAULT_AEMTLI: Array<{
  title: string;
  description: string;
  intervalDays: number;
  mandatory: boolean;
  order: number;
}> = [
  {
    title: "Bad putzen",
    description: "Lavabo, WC, Dusche, Spiegel — alles glaenzt wieder",
    intervalDays: 7,
    mandatory: true,
    order: 0,
  },
  {
    title: "Kueche putzen",
    description: "Herd, Backofen, Spuele, Kuehlschrank von aussen",
    intervalDays: 7,
    mandatory: true,
    order: 1,
  },
  {
    title: "Boden saugen + wischen",
    description: "Gemeinschaftsraeume und Gang",
    intervalDays: 7,
    mandatory: true,
    order: 2,
  },
  {
    title: "Muell + Glas raus",
    description: "Restmuell, Karton, Glas, PET — alles in den Container",
    intervalDays: 7,
    mandatory: true,
    order: 3,
  },
];

// Humorvolle Overdue-Texte je nach Anzahl ueberfaelligen Tagen.
export function overdueRoast(daysOverdue: number, title: string): string {
  const t = title.toLowerCase();
  if (daysOverdue >= 21) {
    return `🦠 Seit ${daysOverdue} Tagen ueberfaellig. Im ${t.includes("bad") ? "Bad" : "WG-Habitat"} entsteht gerade neues Leben.`;
  }
  if (daysOverdue >= 14) {
    return `🕷 ${daysOverdue} Tage ueber. Die Spinnen feiern offiziellen Einzug.`;
  }
  if (daysOverdue >= 7) {
    return `😬 ${daysOverdue} Tage zu spaet. Jemand muss da ran.`;
  }
  return `⏰ ${daysOverdue} Tag${daysOverdue === 1 ? "" : "e"} ueberfaellig.`;
}

// Berechnet aus Anzahl bisheriger Erledigungen und Anzahl WG-Member,
// wer als naechstes dran ist (Index in der nach keyNumber sortierten
// Mitgliederliste).
export function nextRotationIndex(
  totalErledigungen: number,
  memberCount: number
): number {
  if (memberCount === 0) return 0;
  return totalErledigungen % memberCount;
}

export function daysSince(d: Date, now: Date = new Date()): number {
  const ms = now.getTime() - d.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
