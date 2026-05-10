import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// GET /api/meine-wg/[slug]/doodle/[id] — Detail mit Optionen + Votes
export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const d = await prisma.wgDoodle.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      options: {
        include: {
          votes: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!d || d.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    id: d.id,
    title: d.title,
    description: d.description,
    location: d.location,
    duration: d.duration,
    finalized: !!d.finalizedAt,
    finalizedDate: d.finalizedDate?.toISOString() ?? null,
    createdBy: d.createdBy,
    createdAt: d.createdAt.toISOString(),
    options: d.options.map((o) => ({
      id: o.id,
      date: o.date.toISOString(),
      voters: o.votes.map((v) => v.user),
    })),
  });
}

// DELETE /api/meine-wg/[slug]/doodle/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const d = await prisma.wgDoodle.findUnique({ where: { id: params.id } });
  if (!d || d.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  await prisma.wgDoodle.delete({ where: { id: d.id } });
  return NextResponse.json({ ok: true });
}
