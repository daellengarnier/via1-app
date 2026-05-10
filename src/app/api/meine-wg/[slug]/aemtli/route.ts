import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

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
      id: true,
      name: true,
      avatar: true,
      room: { select: { keyNumber: true } },
    },
    orderBy: { name: "asc" },
  });

  // State auto-seeden falls noch nicht vorhanden
  let state = await prisma.wgAemtliState.findUnique({
    where: { wgId: access.wg.id },
    include: {
      lastDoneBy: { select: { id: true, name: true, avatar: true } },
      history: {
        include: {
          byUser: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { doneAt: "desc" },
        take: 50,
      },
      bonusLog: {
        include: {
          byUser: { select: { id: true, name: true, avatar: true } },
        },
      },
      swapRequests: {
        include: {
          fromUser: { select: { id: true, name: true, avatar: true } },
          toUser: { select: { id: true, name: true, avatar: true } },
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
        lastDoneBy: { select: { id: true, name: true, avatar: true } },
        history: {
          include: {
            byUser: { select: { id: true, name: true, avatar: true } },
          },
        },
        bonusLog: {
          include: {
            byUser: { select: { id: true, name: true, avatar: true } },
          },
        },
        swapRequests: {
          include: {
            fromUser: { select: { id: true, name: true, avatar: true } },
            toUser: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  }

  // Aktuell-Dran ermitteln aus rotationOrder + currentIndex
  const order = state.rotationOrder;
  const currentUserId =
    order.length > 0 ? order[state.currentIndex % order.length] : null;
  const currentUser = currentUserId
    ? members.find((m) => m.id === currentUserId) ?? null
    : null;

  return NextResponse.json({
    members,
    rotationOrder: order,
    currentIndex: state.currentIndex,
    currentUser,
    lastDoneBy: state.lastDoneBy,
    lastDoneAt: state.lastDoneAt?.toISOString() ?? null,
    checkedPflicht: state.checkedPflicht,
    customBonus: state.customBonus,
    history: state.history.map((h) => ({
      id: h.id,
      byUser: h.byUser,
      doneAt: h.doneAt.toISOString(),
    })),
    bonusLog: Object.fromEntries(
      state.bonusLog.map((l) => [
        l.taskName,
        { byUser: l.byUser, date: l.date.toISOString() },
      ])
    ),
    swapRequests: state.swapRequests.map((s) => ({
      id: s.id,
      from: s.fromUser,
      to: s.toUser,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
