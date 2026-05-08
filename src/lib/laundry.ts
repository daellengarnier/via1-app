export const LAUNDRY_MACHINES = [
  { key: "left", name: "Maschine links" },
  { key: "right", name: "Maschine rechts" },
] as const;

export const LAUNDRY_PROGRAMS = [
  {
    name: "ECO",
    minutes: 209,
    note: "3:29 laut Programmtabelle",
  },
  {
    name: "Koch & Buntwaesche",
    minutes: 59,
    note: "0:59 laut Programmtabelle",
  },
  {
    name: "Pflegeleicht",
    minutes: 45,
    note: "0:45 laut Programmtabelle",
  },
  {
    name: "Express",
    minutes: 20,
    note: "0:20 laut Programmtabelle",
  },
] as const;

export function getLaundryMachine(key: string) {
  return LAUNDRY_MACHINES.find((m) => m.key === key) ?? null;
}

export function clampLaundryDuration(minutes: number) {
  if (!Number.isFinite(minutes)) return 59;
  return Math.max(1, Math.min(360, Math.round(minutes)));
}
