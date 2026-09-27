import { prisma } from "@/lib/prisma";
import { wgMemberFilter } from "@/lib/wg-access";
import { isoDate } from "@/lib/wg-koch-day";

// Oatly-Hafermilch-Kasse: Bestellungen werden gleichmaessig auf die
// Mittrinkenden verteilt (Snapshot pro Bestellung), Zahlungen gleichen
// aus. Alle Betraege in Rappen.

// carton = Karton 6 x 1.5 l, carton1l = Karton 6 x 1 l,
// single = Packung 1.5 l, single1l = Packung 1 l
export type HafermilchUnit = "carton" | "carton1l" | "single" | "single1l";

export const HAFERMILCH_UNITS: HafermilchUnit[] = [
  "carton",
  "carton1l",
  "single",
  "single1l",
];

export function toUnit(v: unknown): HafermilchUnit {
  return v === "carton1l" || v === "single" || v === "single1l" ? v : "carton";
}

export interface OrderDto {
  id: string;
  date: string;
  boughtById: string;
  unit: HafermilchUnit;
  quantity: number;
  unitCents: number;
  totalCents: number;
  participantIds: string[];
  createdById: string;
}

export interface PaymentDto {
  id: string;
  date: string;
  fromId: string;
  toId: string;
  amountCents: number;
  createdById: string;
}

export interface Settlement {
  fromId: string;
  toId: string;
  amountCents: number;
}

export interface ConsumptionDto {
  // Bezugsdatum der Statistik (= Datum des letzten Vorrats)
  refDate: string;
  // erste Lieferung
  since: string;
  weeks: number;
  participants: number;
  deliveredBottles: number;
  stockCount: number;
  consumedBottles: number;
  // Ø pro Kopf und Woche
  bottlesPerHeadWeek: number;
  litersPerHeadWeek: number;
  // Reichweite des Vorrats in Tagen (null = kein Verbrauch messbar)
  daysLeft: number | null;
}

export interface HafermilchData {
  members: { id: string; name: string }[];
  // Namen auch fuer Personen, die nicht (mehr) Mitglied sind
  names: Record<string, string>;
  settings: {
    participantIds: string[];
    unitCents: number;
    carton1lCents: number;
    singleCents: number;
    single1lCents: number;
    deliveryDays: number;
    stockCount: number | null;
    stockAt: string | null;
  };
  consumption: ConsumptionDto | null;
  orders: OrderDto[];
  payments: PaymentDto[];
  balances: { userId: string; netCents: number }[];
  settlements: Settlement[];
  stats: {
    // Stueckzahlen pro Einheit
    counts: Record<HafermilchUnit, number>;
    totalCents: number;
    participants: number;
    perPersonCents: number;
  };
}

interface OrderLike {
  boughtById: string;
  quantity: number;
  unitCents: number;
  participantIds: string[];
}
interface PaymentLike {
  fromId: string;
  toId: string;
  amountCents: number;
}

// Mittrinkende einer Bestellung — dedupliziert, damit ein doppelt
// gespeicherter Eintrag niemanden doppelt belastet.
function participantsOf(o: OrderLike): string[] {
  const raw = o.participantIds.length > 0 ? o.participantIds : [o.boughtById];
  return Array.from(new Set(raw));
}

// Saldo pro Person: > 0 bekommt Geld, < 0 schuldet Geld.
export function computeBalances(
  orders: OrderLike[],
  payments: PaymentLike[]
): Map<string, number> {
  const bal = new Map<string, number>();
  const add = (id: string, c: number) => bal.set(id, (bal.get(id) ?? 0) + c);
  for (const o of orders) {
    const cost = o.quantity * o.unitCents;
    const parts = participantsOf(o);
    const share = Math.floor(cost / parts.length);
    const rest = cost - share * parts.length;
    add(o.boughtById, cost);
    for (const p of parts) add(p, -share);
    // Rappen-Rest traegt, wer bestellt hat (falls mittrinkend), sonst die
    // erste Person — so bleibt die Summe exakt null.
    add(parts.includes(o.boughtById) ? o.boughtById : parts[0]!, -rest);
  }
  for (const p of payments) {
    add(p.fromId, p.amountCents);
    add(p.toId, -p.amountCents);
  }
  return bal;
}

// Paarweise Schulden: jede Person schuldet jeder Kaeuferin ihren Anteil
// an deren Einkaeufen; Gegenseitiges wird verrechnet, Zahlungen mindern
// die jeweilige Paar-Schuld. Bewusst NICHT "wenigste Zahlungen" — das
// war mathematisch richtig, aber niemand konnte nachvollziehen, warum
// jemand einer dritten Person statt der Kaeuferin zahlen soll.
export function settle(orders: OrderLike[], payments: PaymentLike[]): Settlement[] {
  // debt[from][to] = from schuldet to
  const debt = new Map<string, Map<string, number>>();
  const add = (from: string, to: string, c: number) => {
    if (from === to || c === 0) return;
    const row = debt.get(from) ?? new Map<string, number>();
    row.set(to, (row.get(to) ?? 0) + c);
    debt.set(from, row);
  };
  for (const o of orders) {
    const cost = o.quantity * o.unitCents;
    const parts = participantsOf(o);
    const share = Math.floor(cost / parts.length);
    for (const p of parts) add(p, o.boughtById, share);
  }
  for (const p of payments) add(p.fromId, p.toId, -p.amountCents);

  const out: Settlement[] = [];
  const seen = new Set<string>();
  for (const [a, row] of debt) {
    for (const b of row.keys()) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ab = debt.get(a)?.get(b) ?? 0;
      const ba = debt.get(b)?.get(a) ?? 0;
      const net = ab - ba;
      if (net > 0) out.push({ fromId: a, toId: b, amountCents: net });
      else if (net < 0) out.push({ fromId: b, toId: a, amountCents: -net });
    }
  }
  return out.sort((x, y) => y.amountCents - x.amountCents);
}

export async function loadHafermilch(wgId: string): Promise<HafermilchData> {
  const [members, settings, orders, payments] = await Promise.all([
    prisma.user.findMany({
      where: wgMemberFilter(wgId),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.wgHafermilchSettings.findUnique({ where: { wgId } }),
    prisma.wgHafermilchOrder.findMany({
      where: { wgId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.wgHafermilchPayment.findMany({
      where: { wgId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const participantIds = settings?.participantIds ?? [];
  const unitCents = settings?.unitCents ?? 2490;
  const carton1lCents = settings?.carton1lCents ?? 1740;
  const singleCents = settings?.singleCents ?? 415;
  const single1lCents = settings?.single1lCents ?? 290;
  const deliveryDays = settings?.deliveryDays ?? 2;
  const stockCount = settings?.stockCount ?? null;
  const stockAt = settings?.stockAt ? isoDate(settings.stockAt) : null;

  // Namen fuer alle referenzierten IDs (auch Ex-Mitglieder).
  const ids = new Set<string>(members.map((m) => m.id));
  for (const id of participantIds) ids.add(id);
  for (const o of orders) {
    ids.add(o.boughtById);
    for (const p of o.participantIds) ids.add(p);
  }
  for (const p of payments) {
    ids.add(p.fromId);
    ids.add(p.toId);
  }
  const missing = Array.from(ids).filter((id) => !members.some((m) => m.id === id));
  const extra =
    missing.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: missing } },
          select: { id: true, name: true },
        })
      : [];
  const names: Record<string, string> = {};
  for (const u of [...members, ...extra]) names[u.id] = u.name;

  const bal = computeBalances(orders, payments);
  const counts = { carton: 0, carton1l: 0, single: 0, single1l: 0 };
  for (const o of orders) counts[toUnit(o.unit)] += o.quantity;
  const totalCents = orders.reduce((s, o) => s + o.quantity * o.unitCents, 0);
  const participants = participantIds.length;

  const consumption = computeConsumption(
    orders.map((o) => ({
      date: isoDate(o.date),
      unit: toUnit(o.unit),
      quantity: o.quantity,
    })),
    { deliveryDays, stockCount, stockAt, participants }
  );

  return {
    members,
    names,
    settings: {
      participantIds,
      unitCents,
      carton1lCents,
      singleCents,
      single1lCents,
      deliveryDays,
      stockCount,
      stockAt,
    },
    consumption,
    orders: orders.map((o) => ({
      id: o.id,
      date: isoDate(o.date),
      boughtById: o.boughtById,
      unit: toUnit(o.unit),
      quantity: o.quantity,
      unitCents: o.unitCents,
      totalCents: o.quantity * o.unitCents,
      participantIds: o.participantIds,
      createdById: o.createdById,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      date: isoDate(p.date),
      fromId: p.fromId,
      toId: p.toId,
      amountCents: p.amountCents,
      createdById: p.createdById,
    })),
    balances: Array.from(bal.entries())
      .filter(([, c]) => c !== 0)
      .map(([userId, netCents]) => ({ userId, netCents }))
      .sort((a, b) => b.netCents - a.netCents),
    settlements: settle(orders, payments),
    stats: {
      counts,
      totalCents,
      participants,
      perPersonCents: participants > 0 ? Math.round(totalCents / participants) : 0,
    },
  };
}

export function chf(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function bottlesOf(unit: HafermilchUnit, quantity: number): number {
  return unit === "carton" || unit === "carton1l" ? quantity * 6 : quantity;
}

export function litersOf(unit: HafermilchUnit, quantity: number): number {
  const perBottle = unit === "carton1l" || unit === "single1l" ? 1 : 1.5;
  return bottlesOf(unit, quantity) * perBottle;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

// Verbrauch = gelieferte Flaschen (bis zum Vorrats-Datum) minus Vorrat,
// verteilt auf Personen und Wochen seit der ersten Lieferung. Ohne
// erfassten Vorrat gibt es keine Statistik (null).
export function computeConsumption(
  orders: { date: string; unit: HafermilchUnit; quantity: number }[],
  opts: {
    deliveryDays: number;
    stockCount: number | null;
    stockAt: string | null;
    participants: number;
  }
): ConsumptionDto | null {
  if (opts.stockCount === null || !opts.stockAt || opts.participants <= 0) {
    return null;
  }
  const refDate = opts.stockAt;
  const withDelivery = orders.map((o) => ({
    ...o,
    deliveryDate: addDaysIso(o.date, opts.deliveryDays),
  }));
  const delivered = withDelivery.filter((o) => o.deliveryDate <= refDate);
  if (delivered.length === 0) return null;
  const since = delivered
    .map((o) => o.deliveryDate)
    .sort()[0]!;
  const days = Math.max(1, daysBetween(since, refDate));
  const weeks = days / 7;
  const deliveredBottles = delivered.reduce(
    (s, o) => s + bottlesOf(o.unit, o.quantity),
    0
  );
  const deliveredLiters = delivered.reduce(
    (s, o) => s + litersOf(o.unit, o.quantity),
    0
  );
  const consumedBottles = Math.max(0, deliveredBottles - opts.stockCount);
  // Liter anteilig zum Flaschen-Verbrauch (Mischbestand 1 l / 1.5 l)
  const litersPerBottle = deliveredBottles > 0 ? deliveredLiters / deliveredBottles : 1.5;
  const bottlesPerHeadWeek = consumedBottles / opts.participants / weeks;
  const bottlesPerDay = consumedBottles / days;
  return {
    refDate,
    since,
    weeks,
    participants: opts.participants,
    deliveredBottles,
    stockCount: opts.stockCount,
    consumedBottles,
    bottlesPerHeadWeek,
    litersPerHeadWeek: bottlesPerHeadWeek * litersPerBottle,
    daysLeft: bottlesPerDay > 0 ? opts.stockCount / bottlesPerDay : null,
  };
}

export function unitLabel(unit: HafermilchUnit, quantity: number): string {
  const pack = quantity === 1 ? "Packung" : "Packungen";
  const box = quantity === 1 ? "Karton" : "Kartons";
  if (unit === "single") return `${pack} 1.5 l`;
  if (unit === "single1l") return `${pack} 1 l`;
  if (unit === "carton1l") return `${box} 6 × 1 l`;
  return `${box} 6 × 1.5 l`;
}

export function defaultCentsFor(
  s: { unitCents: number; carton1lCents: number; singleCents: number; single1lCents: number },
  unit: HafermilchUnit
): number {
  if (unit === "carton1l") return s.carton1lCents;
  if (unit === "single") return s.singleCents;
  if (unit === "single1l") return s.single1lCents;
  return s.unitCents;
}
