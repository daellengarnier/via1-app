import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

// GET /api/meine-wg/[slug]/einkauf — Liste (offen + erledigt zuletzt 30 Tage)
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const items = await prisma.wgEinkauf.findMany({
    where: {
      wgId: access.wg.id,
      OR: [{ done: false }, { doneAt: { gte: since } }],
    },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      doneBy: { select: { id: true, name: true, avatar: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      text: i.text,
      done: i.done,
      createdAt: i.createdAt.toISOString(),
      doneAt: i.doneAt?.toISOString() ?? null,
      createdBy: i.createdBy,
      doneBy: i.doneBy,
      comments: i.comments.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
    }))
  );
}

// POST /api/meine-wg/[slug]/einkauf — neuer Eintrag
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = (body?.text ?? "").trim().slice(0, 200);
  if (!text) {
    return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
  }

  const item = await prisma.wgEinkauf.create({
    data: {
      wgId: access.wg.id,
      text,
      createdById: access.user.id,
    },
  });
  return NextResponse.json({ id: item.id });
}
