import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWgAccess } from "@/lib/wg-access";

interface PatchBody {
  title?: string;
  date?: string;
  endDate?: string | null;
  location?: string | null;
  description?: string | null;
  protokoll?: string | null;
}

// GET /api/meine-wg/[slug]/termine/[id]
export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      traktanden: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    id: t.id,
    title: t.title,
    date: t.date.toISOString(),
    endDate: t.endDate?.toISOString() ?? null,
    location: t.location,
    description: t.description,
    protokoll: t.protokoll,
    createdBy: t.createdBy,
    traktanden: t.traktanden.map((tr) => ({
      id: tr.id,
      title: tr.title,
      notes: tr.notes,
      order: tr.order,
    })),
    comments: t.comments.map((c) => ({
      id: c.id,
      text: c.text,
      author: c.author,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// PATCH /api/meine-wg/[slug]/termine/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Ungueltiger Body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.date) {
    const d = new Date(body.date);
    if (!Number.isNaN(d.getTime())) data.date = d;
  }
  if (body.endDate !== undefined) {
    if (body.endDate === null) {
      data.endDate = null;
    } else {
      const d = new Date(body.endDate);
      if (!Number.isNaN(d.getTime())) data.endDate = d;
    }
  }
  if (body.location !== undefined) {
    data.location = body.location?.trim() || null;
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  if (body.protokoll !== undefined) {
    data.protokoll = body.protokoll?.trim() || null;
  }

  await prisma.wgTermin.update({ where: { id: t.id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE /api/meine-wg/[slug]/termine/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const access = await requireWgAccess(params.slug);
  if (!access.ok) return access.response;

  const t = await prisma.wgTermin.findUnique({ where: { id: params.id } });
  if (!t || t.wgId !== access.wg.id) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.wgTermin.delete({ where: { id: t.id } });
  return NextResponse.json({ ok: true });
}
