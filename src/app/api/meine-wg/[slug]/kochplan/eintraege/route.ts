import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";
import { parseIsoDate } from "@/lib/wg-koch-day";

interface CreateBody {
  date?: string;
  time?: string | null;
  title?: string;
  description?: string | null;
  cookId?: string | null;
  selfCook?: boolean;
}

// POST /api/meine-wg/[slug]/kochplan/eintraege
// Anlegen eines Kochplan-Eintrags + Push-Notification an WG-Mitglieder
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
  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  const time = body.time ? body.time.trim().slice(0, 5) : null;
  const description = body.description?.trim() || null;
  const cookId = body.selfCook
    ? access.user.id
    : body.cookId && typeof body.cookId === "string"
      ? body.cookId
      : null;

  const eintrag = await prisma.wgKochEintrag.create({
    data: {
      wgId: access.wg.id,
      date,
      time,
      title,
      description,
      cookId,
      createdById: access.user.id,
    },
    include: {
      cook: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Push: an alle WG-Mitglieder (ausser den Ersteller)
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    const dateStr = new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    await notify({
      kind: "WG_KOCH_NEW",
      title: `🍝 ${access.wg.name}: ${title}`,
      body: `${dateStr}${time ? `, ${time}` : ""} — ${access.user.name} hat ein Essen geplant`,
      link: `/meine-wg/${params.slug}/kochplan`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ id: eintrag.id });
}
