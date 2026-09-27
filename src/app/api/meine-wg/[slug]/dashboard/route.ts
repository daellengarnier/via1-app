import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess, wgMemberFilter } from "@/lib/wg-access";
import { summarizeReactions } from "@/lib/reactions";
import { USER_AVATAR_SELECT, withAvatarUrl } from "@/lib/avatar";
import { loadHafermilch } from "@/lib/hafermilch";
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
    hafermilch,
  ] = await Promise.all([
    prisma.wgKochEintrag.findMany({
      where: { wgId: access.wg.id, date: { gte: today, lte: to } },
      include: {
        cook: { select: USER_AVATAR_SELECT },
        signups: {
          include: {
            user: { select: USER_AVATAR_SELECT },
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
      select: USER_AVATAR_SELECT,
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
        lastDoneBy: { select: USER_AVATAR_SELECT },
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
      select: { ...USER_AVATAR_SELECT, birthday: true },
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
        author: { select: USER_AVATAR_SELECT },
        comments: { select: { id: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    loadHafermilch(access.wg.id),
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
        user: withAvatarUrl(m),
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
      members: kochMembers.map(withAvatarUrl),
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
        cook: withAvatarUrl(e.cook),
        signups: e.signups.map((s) => ({
          user: withAvatarUrl(s.user),
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
          lastDoneBy: withAvatarUrl(aemtliState.lastDoneBy),
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
    hafermilch: {
      participants: hafermilch.stats.participants,
      cartons: hafermilch.stats.counts.carton + hafermilch.stats.counts.carton1l,
      isParticipant: hafermilch.settings.participantIds.includes(access.user.id),
      myNetCents:
        hafermilch.balances.find((b) => b.userId === access.user.id)?.netCents ??
        0,
      // Aufschluesselung pro Person (paarweise, gegenseitig verrechnet)
      owedToMe: hafermilch.settlements
        .filter((s) => s.toId === access.user.id)
        .map((s) => ({
          name: hafermilch.names[s.fromId] ?? "?",
          amountCents: s.amountCents,
        })),
      iOwe: hafermilch.settlements
        .filter((s) => s.fromId === access.user.id)
        .map((s) => ({
          name: hafermilch.names[s.toId] ?? "?",
          amountCents: s.amountCents,
        })),
      stockCount: hafermilch.settings.stockCount,
      stockAt: hafermilch.settings.stockAt,
      daysLeft: hafermilch.consumption?.daysLeft ?? null,
      bottlesPerHeadWeek: hafermilch.consumption?.bottlesPerHeadWeek ?? null,
      litersPerHeadWeek: hafermilch.consumption?.litersPerHeadWeek ?? null,
    },
    pinnwand: pinnwandNotes.map((n) => ({
      id: n.id,
      text: n.text,
      color: n.color,
      author: withAvatarUrl(n.author),
      createdAt: n.createdAt.toISOString(),
      comments: n.comments,
      reactions: summarizeReactions(n.reactions, access.user.id),
    })),
  });
}
