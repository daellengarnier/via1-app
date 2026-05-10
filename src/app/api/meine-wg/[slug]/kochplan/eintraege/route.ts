import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";
import { parseIsoDate } from "@/lib/wg-koch-day";
import { isValidSlot, SLOT_LABEL } from "@/lib/wg-koch-slots";

interface CreateBody {
  date?: string;
  slot?: string;
  time?: string | null;
  menu?: string | null;
  description?: string | null;
  cookId?: string | null;
  selfCook?: boolean;
}

// POST /api/meine-wg/[slug]/kochplan/eintraege
// Anlegen eines Kochplan-Eintrags fuer einen Slot (Mittag/Abend).
// Pro (wg, date, slot) max 1 Eintrag (DB-Constraint).
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }
  const date = body.date ? parseIsoDate(body.date) : null;
  if (!date) {
    return NextResponse.json(
      { error: "Datum fehlt oder ungueltig (YYYY-MM-DD)" },
      { status: 400 }
    );
  }
  if (!isValidSlot(body.slot)) {
    return NextResponse.json(
      { error: "Slot muss 'lunch' oder 'dinner' sein" },
      { status: 400 }
    );
  }
  const slot = body.slot;
  const menu = body.menu?.trim() || null;
  const time = body.time ? body.time.trim().slice(0, 5) : null;
  const description = body.description?.trim() || null;
  const cookId = body.selfCook
    ? access.user.id
    : body.cookId && typeof body.cookId === "string"
      ? body.cookId
      : null;

  let eintrag;
  try {
    eintrag = await prisma.wgKochEintrag.create({
      data: {
        wgId: access.wg.id,
        date,
        slot,
        time,
        menu,
        description,
        cookId,
        createdById: access.user.id,
      },
    });
  } catch (err: unknown) {
    // Unique-Conflict: schon ein Eintrag fuer diesen Slot
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: `Es gibt schon einen Eintrag fuer ${SLOT_LABEL[slot]} an diesem Tag.` },
        { status: 409 }
      );
    }
    throw err;
  }

  // Push an alle WG-Mitglieder ausser Ersteller
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    const dateStr = new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    const what = menu ?? "kocht";
    await notify({
      kind: "WG_KOCH_NEW",
      title: `🍝 ${access.wg.name}: ${SLOT_LABEL[slot]} — ${what}`,
      body: `${dateStr}${time ? `, ${time}` : ""} — ${access.user.name} ist am Start`,
      link: `/meine-wg/${params.slug}/kochplan`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ id: eintrag.id });
}
