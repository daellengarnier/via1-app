// 6 erlaubte Post-It-Farben fuer die WG-Pinnwand
export const PINNWAND_COLORS = [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "purple",
] as const;

export type PinnwandColor = (typeof PINNWAND_COLORS)[number];

export function isValidColor(c: unknown): c is PinnwandColor {
  return typeof c === "string" && (PINNWAND_COLORS as readonly string[]).includes(c);
}
