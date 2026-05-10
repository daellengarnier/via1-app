import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, wgMemberFilter } from "@/lib/wg-access";
import {
  addDaysUTC,
  effectiveKochDay,
  isoDate,
} from "@/lib/wg-koch-day";

// Kombinierter Dashboard-Endpoint: liefert in einem einzigen Call alle
// 6 Datensätze die das WG-Dashboard braucht. Ersetzt 6 separate
// Round-Trips fuer schnelleres erstes Rendering.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const today = effectiveKochDay();
  const to = addDaysUTC(today, 7);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Alles parallel laden
  const [
    eintraege,
    kinder,
    kochMembers,
    shoppingItems,
    aemtliState,
    aemtliMembers,
    termine,
    bdayMembers,
    doodles,
    pinnwandNotes,
  ] = await Promise.all([
    prisma.wgKochEintrag.findMany({
      where: { wgId: access.wg.id, date: { gte: today, lte: to } },
      include: {
        cook: { select: { id: true, name: true, avatar: true } },
        signups: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: [{ date: "asc" }, { slot: "asc" }, { time: "asc" }],
    }),
    prisma.wgKochKind.findMany({
      where: { wgId: access.wg.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: wgMemberFilter(access.wg.id),
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
    }),
    prisma.wgEinkauf.findMany({
      where: {
        wgId: access.wg.id,
        OR: [{ done: false }, { doneAt: { gte: since30d } }],
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        comments: { select: { id: true } },
      },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    }),
    prisma.wgAemtliState.findUnique({
      where: { wgId: access.wg.id },
      include: {
        lastDoneBy: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.user.findMany({
      where: { room: { wgId: access.wg.id } },
      select: { id: true, name: true },
    }),
    prisma.wgTermin.findMany({
      where: { wgId: access.wg.id, date: { gte: now } },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { traktanden: true, comments: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: { AND: [wgMemberFilter(access.wg.id), { birthday: { not: null } }] },
      select: { id: true, name: true, avatar: true, birthday: true },
    }),
    prisma.wgDoodle.findMany({
      where: { wgId: access.wg.id, finalizedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { options: true } },
        options: { include: { _count: { select: { votes: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wgPinnwandNote.findMany({
      where: { wgId: access.wg.id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Geburtstage in den naechsten 7 Tagen ermitteln
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const upcomingBdays = bdayMembers
    .map((m) => {
      if (!m.birthday) return null;
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
      if (daysUntil > 7) return null;
      return {
        user: { id: m.id, name: m.name, avatar: m.avatar },
        date: next.toISOString().slice(0, 10),
        age: next.getFullYear() - m.birthday.getUTCFullYear(),
        daysUntil,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Aemtli aktuell-User
  let aemtliCurrentUser: { id: string; name: string } | null = null;
  if (aemtliState && aemtliState.rotationOrder.length > 0) {
    const idx =
      aemtliState.currentIndex % aemtliState.rotationOrder.length;
    const userId = aemtliState.rotationOrder[idx];
    if (userId) {
      const m = aemtliMembers.find((u) => u.id === userId);
      if (m) aemtliCurrentUser = { id: m.id, name: m.name };
    }
  }

  return NextResponse.json({
    koch: {
      today: isoDate(today),
      members: kochMembers,
      kinder: kinder.map((k) => ({
        id: k.id,
        name: k.name,
        parentIds: k.parentIds,
      })),
      eintraege: eintraege.map((e) => ({
        id: e.id,
        date: isoDate(e.date),
        slot: e.slot,
        time: e.time,
        menu: e.menu,
        description: e.description,
        cook: e.cook,
        signups: e.signups.map((s) => ({
          user: s.user,
          status: s.status,
          childrenIds: s.childrenIds,
          guests: s.guests,
        })),
      })),
    },
    shopping: shoppingItems.map((i) => ({
      id: i.id,
      text: i.text,
      done: i.done,
      createdAt: i.createdAt.toISOString(),
      doneAt: i.doneAt?.toISOString() ?? null,
      createdBy: i.createdBy,
      comments: i.comments,
    })),
    aemtli: aemtliState
      ? {
          rotationOrder: aemtliState.rotationOrder,
          currentIndex: aemtliState.currentIndex,
          currentUser: aemtliCurrentUser,
          lastDoneBy: aemtliState.lastDoneBy,
          lastDoneAt: aemtliState.lastDoneAt?.toISOString() ?? null,
          checkedPflicht: aemtliState.checkedPflicht,
        }
      : null,
    termine: {
      termine: termine.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.date.toISOString(),
        location: t.location,
        traktandenCount: t._count.traktanden,
        commentCount: t._count.comments,
      })),
      birthdays: upcomingBdays,
    },
    doodles: doodles.map((d) => ({
      id: d.id,
      title: d.title,
      finalized: !!d.finalizedAt,
      finalizedDate: d.finalizedDate?.toISOString() ?? null,
      optionCount: d._count.options,
      totalVotes: d.options.reduce((s, o) => s + o._count.votes, 0),
    })),
    pinnwand: pinnwandNotes.map((n) => ({
      id: n.id,
      text: n.text,
      color: n.color,
      author: n.author,
      createdAt: n.createdAt.toISOString(),
      comments: n.comments,
    })),
  });
}
