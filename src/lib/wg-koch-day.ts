// "Effektiver Kochplan-Tag": vor 21:00 Bern-Zeit ist heute, ab 21:00
// rollt's auf morgen weiter. Liefert eine Datums-Repraesentation als
// UTC-Mitternacht des effektiven Tages — passt zur @db.Date Spalte.

const TZ = "Europe/Zurich";

function zurichParts(now: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

export function effectiveKochDay(now: Date = new Date()): Date {
  const { year, month, day, hour } = zurichParts(now);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (hour >= 21) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

export function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Akzeptiert "YYYY-MM-DD" und gibt UTC-Mitternacht zurueck.
export function parseIsoDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
