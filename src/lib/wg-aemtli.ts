// Aemtli-Defaults nach family-wg-Spec.

// 4 Pflicht-Tasks pro Runde — alle muessen abgehakt sein bevor "Erledigt"
export const PFLICHT_TASKS: ReadonlyArray<string> = [
  "Küche, Wohnzimmer & Bad putzen",
  "Böden saugen & feucht aufnehmen",
  "Entsorgen",
  "Gemeinschaftswäsche waschen",
];

// 4 Default-Bonus-Tasks (zusaetzlich koennen Custom-Bonus-Tasks angelegt werden)
export const DEFAULT_BONUS_TASKS: ReadonlyArray<string> = [
  "Fenster putzen",
  "Backofen reinigen",
  "Balkon aufräumen/putzen",
  "Mikrowelle putzen",
];

// Lustige Sprueche die rotieren wenn die WG ueberfaellig ist (>=11 Tage).
export const OVERDUE_JOKES: ReadonlyArray<string> = [
  "Die Staubmäuse organisieren sich 🐭",
  "Der Staubsauger vermisst dich 🥺",
  "Pilze wachsen im Bad – echte! 🍄",
  "WG-Fee hat Burnout ✨",
  "Houston, Putz-Problem 🚀",
  "Müll will Miete zahlen 🗑️",
];

// Ab wievielen Tagen wird's "ueberfaellig"
export const OVERDUE_DAYS_THRESHOLD = 11;

export function daysBetween(d1: Date | string, d2: Date | string = new Date()): number {
  const a = typeof d1 === "string" ? new Date(d1) : d1;
  const b = typeof d2 === "string" ? new Date(d2) : d2;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function pickJoke(daysOverdue: number): string {
  return OVERDUE_JOKES[Math.abs(daysOverdue) % OVERDUE_JOKES.length]!;
}
