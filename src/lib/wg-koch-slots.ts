// Pro Tag genau zwei feste Slots: Mittag und Abend.
export const SLOTS = ["lunch", "dinner"] as const;

export type Slot = (typeof SLOTS)[number];

export function isValidSlot(s: unknown): s is Slot {
  return s === "lunch" || s === "dinner";
}

export const SLOT_LABEL: Record<Slot, string> = {
  lunch: "Mittag",
  dinner: "Abend",
};

export const SLOT_ICON: Record<Slot, string> = {
  lunch: "☀️",
  dinner: "🌙",
};

// Zeit-Presets pro Slot.
export const TIME_PRESETS: Record<Slot, string[]> = {
  lunch: ["12:00", "12:30", "13:00", "13:30"],
  dinner: ["18:30", "19:00", "19:30", "20:00", "20:30"],
};

export const DEFAULT_TIME: Record<Slot, string> = {
  lunch: "12:30",
  dinner: "19:00",
};
