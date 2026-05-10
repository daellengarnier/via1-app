import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface CreateBody {
  title?: string;
  description?: string | null;
  location?: string | null;
  duration?: number | null;
  options?: string[]; // ISO strings
}

// GET /api/meine-wg/[slug]/doodle — Liste aktiver + finalisierter Doodles
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const doodles = await prisma.wgDoodle.findMany({
    where: { wgId: access.wg.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { options: true } },
      options: { include: { _count: { select: { votes: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    doodles.map((d) => ({
      id: d.id,
      title: d.title,
      finalized: !!d.finalizedAt,
      finalizedDate: d.finalizedDate?.toISOString() ?? null,
      createdBy: d.createdBy,
      createdAt: d.createdAt.toISOString(),
      optionCount: d._count.options,
      totalVotes: d.options.reduce((s, o) => s + o._count.votes, 0),
    }))
  );
}

// POST /api/meine-wg/[slug]/doodle — neuer Doodle mit Optionen
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
  const opts = Array.isArray(body?.options) ? body.options : [];
  const dates = opts
    .map((o) => new Date(o))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (dates.length < 2) {
    return NextResponse.json(
      { error: "Mindestens 2 Datums-Optionen noetig" },
      { status: 400 }
    );
  }

  const duration =
    typeof body?.duration === "number" && body.duration > 0
      ? Math.min(24 * 60, Math.floor(body.duration))
      : null;

  const d = await prisma.wgDoodle.create({
    data: {
      wgId: access.wg.id,
      title,
      description: body?.description?.trim() || null,
      location: body?.location?.trim() || null,
      duration,
      createdById: access.user.id,
      options: {
        create: dates.map((date) => ({ date })),
      },
    },
  });
  return NextResponse.json({ id: d.id });
}
