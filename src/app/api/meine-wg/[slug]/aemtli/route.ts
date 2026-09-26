import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { USER_AVATAR_SELECT, withAvatarUrl } from "@/lib/avatar";

// GET /api/meine-wg/[slug]/aemtli — kompletter State (auto-seed bei Bedarf)
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  // WG-Mitglieder ermitteln (User mit Zimmer in dieser WG)
  const members = await prisma.user.findMany({
    where: { room: { wgId: access.wg.id } },
    select: {
      ...USER_AVATAR_SELECT,
      room: { select: { keyNumber: true } },
    },
    orderBy: { name: "asc" },
  });

  // State auto-seeden falls noch nicht vorhanden
  let state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
    include: {
      lastDoneBy: { select: USER_AVATAR_SELECT },
      history: {
        include: {
          byUser: { select: USER_AVATAR_SELECT },
        },
        orderBy: { doneAt: "desc" },
        take: 50,
      },
      bonusLog: {
        include: {
          byUser: { select: USER_AVATAR_SELECT },
        },
      },
      swapRequests: {
        include: {
          fromUser: { select: USER_AVATAR_SELECT },
          toUser: { select: USER_AVATAR_SELECT },
        },
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!state) {
    state = await prisma.wgAemtliState.create({
      data: {
        wgId: access.wg.id,
        rotationOrder: members.map((m) => m.id),
      },
      include: {
        lastDoneBy: { select: USER_AVATAR_SELECT },
        history: {
          include: {
            byUser: { select: USER_AVATAR_SELECT },
          },
        },
        bonusLog: {
          include: {
            byUser: { select: USER_AVATAR_SELECT },
          },
        },
        swapRequests: {
          include: {
            fromUser: { select: USER_AVATAR_SELECT },
            toUser: { select: USER_AVATAR_SELECT },
          },
        },
      },
    });
  }

  // Aktuell-Dran ermitteln aus rotationOrder + currentIndex
  const order = state.rotationOrder;
  const currentUserId =
    order.length > 0 ? order[state.currentIndex % order.length] : null;
  const publicMembers = members.map((m) => ({
    ...withAvatarUrl(m),
    room: m.room,
  }));
  const currentUser = currentUserId
    ? publicMembers.find((m) => m.id === currentUserId) ?? null
    : null;

  return NextResponse.json({
    members: publicMembers,
    rotationOrder: order,
    currentIndex: state.currentIndex,
    currentUser,
    lastDoneBy: withAvatarUrl(state.lastDoneBy),
    lastDoneAt: state.lastDoneAt?.toISOString() ?? null,
    checkedPflicht: state.checkedPflicht,
    customBonus: state.customBonus,
    history: state.history.map((h) => ({
      id: h.id,
      byUser: withAvatarUrl(h.byUser),
      doneAt: h.doneAt.toISOString(),
    })),
    bonusLog: Object.fromEntries(
      state.bonusLog.map((l) => [
        l.taskName,
        { byUser: withAvatarUrl(l.byUser), date: l.date.toISOString() },
      ])
    ),
    swapRequests: state.swapRequests.map((s) => ({
      id: s.id,
      from: withAvatarUrl(s.fromUser),
      to: withAvatarUrl(s.toUser),
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
