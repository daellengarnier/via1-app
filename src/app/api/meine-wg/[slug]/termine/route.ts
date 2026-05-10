import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getWgMemberUserIds, requireWgAccess } from "@/lib/wg-access";

interface CreateBody {
  title?: string;
  date?: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
}

// GET /api/meine-wg/[slug]/termine
// Liefert kommende Termine, vergangene 30 Tage, plus Geburtstage in
// den naechsten 7 Tagen aus User-Profilen der WG-Mitglieder.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [termine, members] = await Promise.all([
    prisma.wgTermin.findMany({
      where: { wgId: access.wg.id, date: { gte: since } },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: {
          select: { traktanden: true, comments: true },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.user.findMany({
      where: { room: { wgId: access.wg.id }, birthday: { not: null } },
      select: {
        id: true,
        name: true,
        avatar: true,
        birthday: true,
      },
    }),
  ]);

  // Geburtstage in den naechsten 7 Tagen
  const upcoming: Array<{
    user: { id: string; name: string; avatar: string | null };
    date: string;
    age: number | null;
    daysUntil: number;
  }> = [];
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);
  for (const m of members) {
    if (!m.birthday) continue;
    const bdMonth = m.birthday.getUTCMonth();
    const bdDay = m.birthday.getUTCDate();
    const year = todayMidnight.getFullYear();
    let next = new Date(year, bdMonth, bdDay);
    if (next.getTime() < todayMidnight.getTime()) {
      next = new Date(year + 1, bdMonth, bdDay);
    }
    const daysUntil = Math.round(
      (next.getTime() - todayMidnight.getTime()) / 86400000
    );
    if (daysUntil <= 7) {
      const age =
        next.getFullYear() - m.birthday.getUTCFullYear();
      upcoming.push({
        user: { id: m.id, name: m.name, avatar: m.avatar },
        date: next.toISOString().slice(0, 10),
        age,
        daysUntil,
      });
    }
  }
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

  return NextResponse.json({
    termine: termine.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date.toISOString(),
      endDate: t.endDate?.toISOString() ?? null,
      location: t.location,
      description: t.description,
      hasProtokoll: !!t.protokoll,
      createdBy: t.createdBy,
      traktandenCount: t._count.traktanden,
      commentCount: t._count.comments,
    })),
    birthdays: upcoming,
  });
}

// POST /api/meine-wg/[slug]/termine
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const title = (body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  const date = body?.date ? new Date(body.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Datum ungueltig" }, { status: 400 });
  }
  const endDate = body?.endDate ? new Date(body.endDate) : null;
  const endValid = endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;

  const t = await prisma.wgTermin.create({
    data: {
      wgId: access.wg.id,
      title,
      date,
      endDate: endValid,
      location: body?.location?.trim() || null,
      description: body?.description?.trim() || null,
      createdById: access.user.id,
    },
  });

  // Push an alle WG-Member ausser Ersteller
  const memberIds = await getWgMemberUserIds(access.wg.id);
  if (memberIds.length > 0) {
    const dateStr = new Intl.DateTimeFormat("de-CH", {
      timeZone: "Europe/Zurich",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    await notify({
      kind: "WG_TERMIN_NEW",
      title: `📅 ${access.wg.name}: ${title}`,
      body: `${dateStr} — neuer WG-Termin`,
      link: `/meine-wg/${params.slug}/termine/${t.id}`,
      audience: memberIds,
      excludeUserId: access.user.id,
    });
  }

  return NextResponse.json({ id: t.id });
}
