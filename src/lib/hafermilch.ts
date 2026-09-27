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
  };
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

// Saldo pro Person: > 0 bekommt Geld, < 0 schuldet Geld.
export function computeBalances(
  orders: OrderLike[],
  payments: PaymentLike[]
): Map<string, number> {
  const bal = new Map<string, number>();
  const add = (id: string, c: number) => bal.set(id, (bal.get(id) ?? 0) + c);
  for (const o of orders) {
    const cost = o.quantity * o.unitCents;
    const parts = o.participantIds.length > 0 ? o.participantIds : [o.boughtById];
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

// Wenigste Zahlungen, damit alle bei null landen (greedy).
export function settle(bal: Map<string, number>): Settlement[] {
  const debtors = Array.from(bal.entries())
    .filter(([, c]) => c < 0)
    .map(([id, c]) => ({ id, c: -c }))
    .sort((a, b) => b.c - a.c);
  const creditors = Array.from(bal.entries())
    .filter(([, c]) => c > 0)
    .map(([id, c]) => ({ id, c }))
    .sort((a, b) => b.c - a.c);
  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const amount = Math.min(d.c, c.c);
    if (amount > 0) out.push({ fromId: d.id, toId: c.id, amountCents: amount });
    d.c -= amount;
    c.c -= amount;
    if (d.c === 0) i += 1;
    if (c.c === 0) j += 1;
  }
  return out;
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

  return {
    members,
    names,
    settings: { participantIds, unitCents, carton1lCents, singleCents, single1lCents },
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
    settlements: settle(bal),
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
