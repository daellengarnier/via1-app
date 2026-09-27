import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, wgMemberFilter } from "@/lib/wg-access";
import { loadHafermilch } from "@/lib/hafermilch";
import { effectiveKochDay, parseIsoDate } from "@/lib/wg-koch-day";

// GET /api/meine-wg/[slug]/hafermilch — kompletter Stand der Oatly-Kasse
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;
  return NextResponse.json(await loadHafermilch(access.wg.id));
}

// PUT /api/meine-wg/[slug]/hafermilch — Einstellungen: wer trinkt mit,
// Standardpreis pro Karton. Jedes WG-Mitglied darf das anpassen.
export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as {
    participantIds?: unknown;
    unitCents?: unknown;
    carton1lCents?: unknown;
    singleCents?: unknown;
    single1lCents?: unknown;
    deliveryDays?: unknown;
    stockCount?: unknown;
    stockAt?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: {
    participantIds?: string[];
    unitCents?: number;
    carton1lCents?: number;
    singleCents?: number;
    single1lCents?: number;
    deliveryDays?: number;
    stockCount?: number;
    stockAt?: Date;
  } = {};

  if (typeof body.deliveryDays === "number" && Number.isFinite(body.deliveryDays)) {
    data.deliveryDays = Math.max(0, Math.min(30, Math.round(body.deliveryDays)));
  }
  if (typeof body.stockCount === "number" && Number.isFinite(body.stockCount)) {
    data.stockCount = Math.max(0, Math.min(1000, Math.round(body.stockCount)));
    data.stockAt =
      (typeof body.stockAt === "string" ? parseIsoDate(body.stockAt) : null) ??
      effectiveKochDay();
  }
  if (Array.isArray(body.participantIds)) {
    const wanted = body.participantIds.filter(
      (x): x is string => typeof x === "string"
    );
    const members = await prisma.user.findMany({
      where: { AND: [wgMemberFilter(access.wg.id), { id: { in: wanted } }] },
      select: { id: true },
    });
    data.participantIds = members.map((m) => m.id);
  }
  const priceFields = ["unitCents", "carton1lCents", "singleCents", "single1lCents"] as const;
  for (const f of priceFields) {
    const v = body[f];
    if (typeof v === "number" && Number.isFinite(v)) {
      const c = Math.round(v);
      if (c < 1 || c > 100_000) {
        return NextResponse.json({ error: "Preis unplausibel" }, { status: 400 });
      }
      data[f] = c;
    }
  }

  await prisma.wgHafermilchSettings.upsert({
    where: { wgId: access.wg.id },
    create: { wgId: access.wg.id, ...data },
    update: data,
  });
  return NextResponse.json(await loadHafermilch(access.wg.id));
}
