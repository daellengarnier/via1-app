import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireWgAccess } from "@/lib/wg-access";
import { effectiveKochDay, parseIsoDate } from "@/lib/wg-koch-day";
import { chf, loadHafermilch } from "@/lib/hafermilch";

// POST /api/meine-wg/[slug]/hafermilch/payments
// Body: { toId, amountCents, date? } — "Ich habe X an Y bezahlt".
// Vertrauensbasiert: keine Gegenbestaetigung, die Empfaengerin bekommt
// eine Mitteilung und kann die Zahlung notfalls loeschen.
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as {
    toId?: unknown;
    amountCents?: unknown;
    date?: unknown;
  } | null;
  const toId = typeof body?.toId === "string" ? body.toId : "";
  const amountCents =
    typeof body?.amountCents === "number" ? Math.round(body.amountCents) : NaN;
  if (!toId || toId === access.user.id) {
    return NextResponse.json({ error: "Empfaenger fehlt" }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents < 1 || amountCents > 1_000_000) {
    return NextResponse.json({ error: "Betrag unplausibel" }, { status: 400 });
  }
  const date =
    (typeof body?.date === "string" ? parseIsoDate(body.date) : null) ??
    effectiveKochDay();

  const to = await prisma.user.findUnique({
    where: { id: toId },
    select: { id: true, name: true },
  });
  if (!to) {
    return NextResponse.json({ error: "Empfaenger nicht gefunden" }, { status: 404 });
  }

  await prisma.wgHafermilchPayment.create({
    data: {
      wgId: access.wg.id,
      fromId: access.user.id,
      toId: to.id,
      amountCents,
      date,
      createdById: access.user.id,
    },
  });

  await notify({
    kind: "WG_EINKAUF_COMMENT",
    title: `🥛 Oatly: ${access.user.name} hat dir CHF ${chf(amountCents)} bezahlt`,
    body: "Als bezahlt markiert — bitte kurz pruefen.",
    link: `/meine-wg/${params.slug}/hafermilch`,
    audience: [to.id],
  });

  return NextResponse.json(await loadHafermilch(access.wg.id));
}
