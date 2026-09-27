import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireWgAccess } from "@/lib/wg-access";
import { parseIsoDate } from "@/lib/wg-koch-day";
import {
  chf,
  defaultCentsFor,
  loadHafermilch,
  toUnit,
  unitLabel,
} from "@/lib/hafermilch";

// POST /api/meine-wg/[slug]/hafermilch/orders
// Body: { date: "YYYY-MM-DD", quantity, unit?: "carton"|"single",
//         unitCents?, boughtById? }
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as {
    date?: unknown;
    quantity?: unknown;
    unit?: unknown;
    unitCents?: unknown;
    boughtById?: unknown;
  } | null;
  const date = typeof body?.date === "string" ? parseIsoDate(body.date) : null;
  const quantity =
    typeof body?.quantity === "number" ? Math.floor(body.quantity) : NaN;
  const unit = toUnit(body?.unit);
  if (!date || !Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json(
      { error: "Datum und Anzahl (1-100) erforderlich" },
      { status: 400 }
    );
  }

  const settings = await prisma.wgHafermilchSettings.findUnique({
    where: { wgId: access.wg.id },
  });
  const participantIds = settings?.participantIds ?? [];
  if (participantIds.length === 0) {
    return NextResponse.json(
      { error: "Zuerst festlegen, wer mittrinkt (Einstellungen)." },
      { status: 400 }
    );
  }

  const defaultCents = defaultCentsFor(
    {
      unitCents: settings?.unitCents ?? 2490,
      carton1lCents: settings?.carton1lCents ?? 1740,
      singleCents: settings?.singleCents ?? 415,
      single1lCents: settings?.single1lCents ?? 290,
    },
    unit
  );
  const unitCents =
    typeof body?.unitCents === "number" && Number.isFinite(body.unitCents)
      ? Math.round(body.unitCents)
      : defaultCents;
  if (unitCents < 1 || unitCents > 100_000) {
    return NextResponse.json({ error: "Preis unplausibel" }, { status: 400 });
  }

  const boughtById =
    typeof body?.boughtById === "string" && body.boughtById
      ? body.boughtById
      : access.user.id;

  await prisma.wgHafermilchOrder.create({
    data: {
      wgId: access.wg.id,
      boughtById,
      date,
      unit,
      quantity,
      unitCents,
      participantIds,
      createdById: access.user.id,
    },
  });

  // Mittrinkende informieren (ohne den Erfasser). Kind "WG_EINKAUF_COMMENT"
  // steuert nur die Pref notifyMeineWg — kein neuer Enum-Wert noetig.
  const buyerName =
    boughtById === access.user.id
      ? access.user.name
      : (await prisma.user.findUnique({
          where: { id: boughtById },
          select: { name: true },
        }))?.name ?? "Jemand";
  const audience = participantIds.filter((id) => id !== access.user.id);
  if (audience.length > 0) {
    await notify({
      kind: "WG_EINKAUF_COMMENT",
      title: `🥛 Oatly: ${buyerName} hat ${quantity} ${unitLabel(unit, quantity)} bestellt`,
      body: `CHF ${chf(quantity * unitCents)} — ${chf(Math.floor((quantity * unitCents) / participantIds.length))} pro Person`,
      link: `/meine-wg/${params.slug}/hafermilch`,
      audience,
    });
  }

  return NextResponse.json(await loadHafermilch(access.wg.id));
}
