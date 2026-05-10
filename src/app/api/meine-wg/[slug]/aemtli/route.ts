import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";
import { DEFAULT_AEMTLI, daysSince, nextRotationIndex } from "@/lib/wg-aemtli";

// GET /api/meine-wg/[slug]/aemtli — Liste mit Rotation, last/next Person,
// Overdue-Status. Seedet Default-Aemtli bei erstem Aufruf falls leer.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  // Members = Bewohner mit Zimmer in dieser WG, sortiert nach keyNumber
  const members = await prisma.user.findMany({
    where: { room: { wgId: access.wg.id } },
    select: {
      id: true,
      name: true,
      avatar: true,
      room: { select: { keyNumber: true } },
    },
    orderBy: { room: { keyNumber: "asc" } },
  });

  // Auto-Seed: wenn diese WG noch keine Aemtli hat, lege Defaults an
  let aemtli = await prisma.wgAemtli.findMany({
    where: { wgId: access.wg.id },
    include: {
      history: {
        orderBy: { doneAt: "desc" },
        take: 1,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      _count: { select: { history: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (aemtli.length === 0) {
    await prisma.wgAemtli.createMany({
      data: DEFAULT_AEMTLI.map((d) => ({
        wgId: access.wg.id,
        title: d.title,
        description: d.description,
        intervalDays: d.intervalDays,
        mandatory: d.mandatory,
        order: d.order,
      })),
    });
    aemtli = await prisma.wgAemtli.findMany({
      where: { wgId: access.wg.id },
      include: {
        history: {
          orderBy: { doneAt: "desc" },
          take: 1,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { history: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      keyNumber: m.room?.keyNumber ?? null,
    })),
    aemtli: aemtli.map((a) => {
      const last = a.history[0];
      const totalDone = a._count.history;
      const nextIdx = nextRotationIndex(totalDone, members.length);
      const nextMember = members[nextIdx];
      const overdueDays = last ? daysSince(last.doneAt) - a.intervalDays : 999;
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        intervalDays: a.intervalDays,
        mandatory: a.mandatory,
        order: a.order,
        active: a.active,
        lastDoneAt: last?.doneAt.toISOString() ?? null,
        lastDoneBy: last?.user ?? null,
        nextMember: nextMember
          ? {
              id: nextMember.id,
              name: nextMember.name,
              avatar: nextMember.avatar,
            }
          : null,
        totalDone,
        overdueDays: Math.max(0, overdueDays),
      };
    }),
  });
}

// POST /api/meine-wg/[slug]/aemtli — neues Aemtli anlegen
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    description?: string | null;
    intervalDays?: number;
    mandatory?: boolean;
  } | null;

  const title = (body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }
  const intervalDays = Math.max(
    1,
    Math.min(365, Math.floor(body?.intervalDays ?? 7))
  );

  // Order = aktuelles Maximum + 1
  const max = await prisma.wgAemtli.findFirst({
    where: { wgId: access.wg.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (max?.order ?? -1) + 1;

  const a = await prisma.wgAemtli.create({
    data: {
      wgId: access.wg.id,
      title,
      description: body?.description?.trim() || null,
      intervalDays,
      mandatory: !!body?.mandatory,
      order,
    },
  });
  return NextResponse.json({ id: a.id });
}
